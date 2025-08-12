const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const router = express.Router();
const File = require("../models/File");
const { processPDFForEmbeddings } = require('../services/embeddingProcessor');

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Helper: calculate file hash
function calculateFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { originalname, filename, size, mimetype, path: filePath } = req.file;
    const fileHash = calculateFileHash(filePath);

    // Check if file already exists in DB
    let existingFile = await File.findOne({ originalName: originalname });

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

      // Replace with new version
      existingFile.version += 1;
      existingFile.savedName = filename;
      existingFile.size = size;
      existingFile.mimeType = mimetype;
      existingFile.path = filePath;
      existingFile.fileHash = fileHash;
      existingFile.uploadDate = new Date();
      existingFile.aiProcessed = "pending";

      await existingFile.save();

      if (mimetype === 'application/pdf') {
        console.log(`🔍 Starting AI processing for PDF: ${filename}`);
        processPDFForEmbeddings(existingFile._id); // Or newFile._id
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
      savedName: filename,
      size,
      mimeType: mimetype,
      path: filePath,
      fileHash,
      version: 1,
      versions: [],
      tags: [],
      summary: "",
      extractedText: "",
      aiProcessed: "pending",
      uploadedBy: "root"
    });

    await newFile.save();
    if (mimetype === 'application/pdf') {
      console.log(`🔍 Starting AI processing for new PDF: ${filename}`);
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
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = router;
