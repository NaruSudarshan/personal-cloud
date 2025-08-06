const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const File = require("../models/File");

const uploadDir = path.join(__dirname, "../uploads");

// Get latest version of each file
router.get("/", async (req, res) => {
  try {
    const latestFiles = await File.aggregate([
      { $sort: { version: -1, uploadDate: -1 } },
      {
        $group: {
          _id: "$originalName",
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { uploadDate: -1 } }
    ]);

    const fileData = latestFiles.map(file => ({
      id: file._id,
      name: file.originalName,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: file.uploadDate.toISOString(),
      version: file.version,
    }));

    res.json(fileData);
  } catch (err) {
    console.error("Error fetching latest file versions:", err);
    res.status(500).json({ error: "Failed to fetch latest file versions" });
  }
});

// Get all versions of a file
router.get("/versions/:name", async (req, res) => {
  try {
    const versions = await File.find({ originalName: req.params.name }).sort({ version: -1 });

    if (!versions.length) {
      return res.status(404).json({ error: "No versions found for this file" });
    }

    const versionData = versions.map(file => ({
      id: file._id,
      name: file.originalName,
      version: file.version,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: file.uploadDate.toISOString(),
    }));

    res.json(versionData);
  } catch (err) {
    console.error("Error fetching file versions:", err);
    res.status(500).json({ error: "Failed to fetch file versions" });
  }
});

// Download version by ID
router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    const filePath = path.join(uploadDir, file.savedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on disk" });

    res.download(filePath, file.originalName);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

// Delete version by ID
router.delete("/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    const filePath = path.join(uploadDir, file.savedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.deleteOne({ _id: req.params.id });

    res.json({ message: `Deleted version ${file.version} of ${file.originalName}` });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
