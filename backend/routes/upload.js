const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const router = express.Router();
const File = require("../models/File");
const { authenticateToken } = require("../middleware/auth");
const { ensureRootOwnerForGroup, getRootOwnerObjectId } = require('../utils/rootOwnership');
const { processPDFForEmbeddings } = require('../services/embeddingProcessor');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Use memory storage so we can stream directly to S3 and compute hash from buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize S3 client — credentials and region are taken from env or AWS SDK default chain
const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET;

// calculate file hash from a Buffer
function calculateFileHashFromBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

router.post("/", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { originalname, size, mimetype, buffer } = req.file;
    const fileHash = calculateFileHashFromBuffer(buffer);

    const ownerObjectId = getRootOwnerObjectId(req);
    if (!ownerObjectId) {
      return res.status(403).json({ error: 'Unable to resolve root owner for upload' });
    }

    await ensureRootOwnerForGroup(ownerObjectId);

    // S3 key: user prefix + timestamp + original name
    const savedName = `${Date.now()}-${originalname}`;
    const key = `${req.user.username}/${savedName}`;

    // Upload to S3
    if (!BUCKET) throw new Error('S3_BUCKET is not configured in environment variables');

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype
    }));

    // Check if file already exists in DB by original name
  let existingFile = await File.findOne({ originalName: originalname, rootOwner: ownerObjectId });

    if (existingFile) {
      // Push current version into versions array
      existingFile.versions.push({
        versionNumber: existingFile.version,
        savedName: existingFile.savedName,
        size: existingFile.size,
        path: existingFile.path,
        uploadDate: existingFile.uploadDate,
        fileHash: existingFile.fileHash
      });

      // Replace with new version metadata
      existingFile.version += 1;
      existingFile.savedName = savedName;
      existingFile.size = size;
      existingFile.mimeType = mimetype;
      existingFile.path = key; // store S3 key here
      existingFile.fileHash = fileHash;
      existingFile.uploadDate = new Date();
  existingFile.aiProcessed = "pending";
  existingFile.rootOwner = ownerObjectId;
  existingFile.uploadedByUser = req.user._id;

      await existingFile.save();

      if (mimetype === 'application/pdf') {
        console.log(`🔍 Starting AI processing for PDF: ${savedName}`);
          processPDFForEmbeddings(existingFile._id);
      }

      return res.status(200).json({
        message: "New version uploaded successfully",
        file: {
          id: existingFile._id,
          name: existingFile.originalName,
          version: existingFile.version
        }
      });
    }

    // Create new file document
    const newFile = new File({
      originalName: originalname,
      savedName,
      size,
      mimeType: mimetype,
      path: key, // S3 key
      fileHash,
      version: 1,
      versions: [],
      tags: [],
      summary: "",
      extractedText: "",
      aiProcessed: "pending",
      uploadedBy: req.user.username,
      uploadedByUser: req.user._id,
      rootOwner: ownerObjectId
    });

    await newFile.save();

    if (mimetype === 'application/pdf') {
      console.log(`🔍 Starting AI processing for new PDF: ${savedName}`);
      processPDFForEmbeddings(newFile._id);
    }

    res.status(201).json({
      message: "File uploaded successfully",
      file: {
        id: newFile._id,
        name: newFile.originalName,
        version: newFile.version
      }
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "File upload failed", details: err.message });
  }
});

module.exports = router;
