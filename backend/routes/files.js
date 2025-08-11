// routes/files.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const mongoose = require("mongoose");
const File = require("../models/File"); // Your new File model
const { CLIENT_RENEG_WINDOW } = require("tls");
const { log } = require("console");

const uploadDir = path.join(__dirname, "../uploads");

// Get the latest version of each file
router.get("/", async (req, res) => {
  try {
    // With the new schema, each document IS the latest version. No aggregation needed.
    const latestFiles = await File.find({}).sort({ uploadDate: -1 });

    const fileData = latestFiles.map(file => ({
      id: file._id,
      name: file.originalName,
      // Add other relevant fields you want to show in the main list
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: file.uploadDate.toISOString(),
      version: file.version,
      uploadedBy: file.uploadedBy, // Example of adding new data
    }));

    res.json(fileData);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Get all versions of a specific file
router.get("/versions/:name", async (req, res) => {
  try {
    const file = await File.findOne({ originalName: req.params.name });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // The current document represents the latest version
    const latestVersion = {
      id: file._id, // The main document's ID
      name: file.originalName,
      version: file.version,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: file.uploadDate.toISOString(),
    };

    // The 'versions' array holds the older versions
    const oldVersions = file.versions.map(v => ({
      id: v._id, // The sub-document's ID
      name: file.originalName, // Name is the same
      version: v.version,
      size: `${(v.size / 1024).toFixed(1)} KB`,
      uploadedAt: v.uploadDate.toISOString(),
    })).sort((a, b) => b.version - a.version); // Sort descending

    res.json([latestVersion, ...oldVersions]);
  } catch (err) {
    console.error("Error fetching file versions:", err);
    res.status(500).json({ error: "Failed to fetch file versions" });
  }
});

// Download a specific file version by its unique ID
router.get("/download/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    // First, check if the ID is for a main document (latest version)
    let file = await File.findById(req.params.id);
    let versionData = file;

    // If not found, check if it's an ID for a sub-document (older version)
    if (!file) {
      file = await File.findOne({ "versions._id": req.params.id });
      if (file) {
         versionData = file.versions.find(v => v._id.toString() === req.params.id);
      }
    }

    if (!versionData) {
      return res.status(404).json({ error: "File version not found" });
    }

    const filePath = path.join(uploadDir, versionData.savedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File missing on disk" });
    }

    res.download(filePath, file.originalName);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});


// Delete a specific file version by its unique ID
router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const fileToDelete = await File.findById(req.params.id);

        // CASE 1: The ID is for the LATEST version (the main document)
        if (fileToDelete) {
            // If there are no older versions, delete the whole document
            if (fileToDelete.versions.length === 0) {
                fs.unlinkSync(path.join(uploadDir, fileToDelete.savedName)); // Delete physical file
                await File.deleteOne({ _id: fileToDelete._id });
                return res.json({ message: `Deleted ${fileToDelete.originalName} completely.` });
            }

            // If there are older versions, promote the newest one
            fileToDelete.versions.sort((a, b) => b.version - a.version); // Ensure sorted
            const versionToPromote = fileToDelete.versions.shift(); // Get newest old version

            // Delete the old latest version's physical file
            fs.unlinkSync(path.join(uploadDir, fileToDelete.savedName));

            // Update the main document with the promoted version's data
            fileToDelete.savedName = versionToPromote.savedName;
            fileToDelete.size = versionToPromote.size;
            fileToDelete.mimeType = versionToPromote.mimeType;
            fileToDelete.path = versionToPromote.path;
            fileToDelete.fileHash = versionToPromote.fileHash;
            fileToDelete.version = versionToPromote.version;
            fileToDelete.uploadDate = versionToPromote.uploadDate;
            // Reset AI processing status for the new content
            fileToDelete.aiProcessed = "pending"; 
            
            await fileToDelete.save();

            return res.json({ message: `Deleted latest version. Promoted v${versionToPromote.version} of ${fileToDelete.originalName}.` });
        }

        // CASE 2: The ID is for an OLDER version (a sub-document)
        const parentFile = await File.findOne({ "versions._id": req.params.id });
        if (parentFile) {
            const versionToDelete = parentFile.versions.find(v => v._id.toString() === req.params.id);
            if (!versionToDelete) return res.status(404).json({ error: "Version not found in parent" });
            
            // Delete the physical file
            const filePath = path.join(uploadDir, versionToDelete.savedName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            // Pull the version from the array in the DB
            await File.updateOne(
                { _id: parentFile._id },
                { $pull: { versions: { _id: versionToDelete._id } } }
            );

            return res.json({ message: `Deleted version ${versionToDelete.version} of ${parentFile.originalName}` });
        }

        return res.status(404).json({ error: "File version not found" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Delete failed" });
    }
});


module.exports = router;