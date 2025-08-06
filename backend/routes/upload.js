const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const File = require("../models/File");

const uploadDir = path.join(__dirname, "../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post("/", upload.single("file"), async (req, res) => {
  const { originalname, filename, size, path: filePath } = req.file;

  try {
    // Check how many versions already exist
    const latestVersion = await File.find({ originalName: originalname })
      .sort({ version: -1 })
      .limit(1);

    const version = latestVersion.length ? latestVersion[0].version + 1 : 1;

    const newFile = new File({
      originalName: originalname,
      savedName: filename,
      size,
      path: filePath,
      version
    });

    await newFile.save();

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
