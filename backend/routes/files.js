const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const File = require("../models/File");
const { authenticateToken } = require("../middleware/auth");
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Embedding = require('../models/Embedding');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET;

// Get the latest version of each file
router.get("/", authenticateToken, async (req, res) => {
  try {
    const rootOwnerId = req.user.rootOwner;

    // Build file filter based on user role
    const fileFilter = { rootOwner: rootOwnerId };
    // if (req.user.role !== 'root') {
    //   fileFilter.uploadedBy = req.user._id;
    // }

    const latestFiles = await File.find(fileFilter)
      .sort({ uploadDate: -1 })
      .populate('uploadedBy', 'username name');

    const fileData = latestFiles.map(file => ({
      id: file._id,
      name: file.originalName,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: file.uploadDate.toISOString(),
      version: file.version,
      uploadedBy: file.uploadedBy?.username || 'Unknown',
      aiProcessed: file.aiProcessed || 'pending'
    }));

    res.json(fileData);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Get all versions of a specific file
router.get("/versions/:name", authenticateToken, async (req, res) => {
  try {
    const rootOwnerId = req.user.rootOwner;

    // Build file filter based on user role
    const fileFilter = { 
      originalName: req.params.name,
      rootOwner: rootOwnerId 
    };
    // if (req.user.role !== 'root') {
    //   fileFilter.uploadedBy = req.user._id;
    // }

    const file = await File.findOne(fileFilter)
      .populate('uploadedBy', 'username name')
      .populate('versions.uploadedBy', 'username name');

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // The current document represents the latest version
    const latestVersion = {
      id: file._id,
      name: file.originalName,
      version: file.version,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: file.uploadDate.toISOString(),
      uploadedBy: file.uploadedBy?.username || 'Unknown'
    };

    // The 'versions' array holds the older versions
    const oldVersions = file.versions.map(v => ({
      id: v._id,
      name: file.savedName,
      version: v.versionNumber,
      size: `${(v.size / 1024).toFixed(1)} KB`,
      uploadedAt: v.uploadDate.toISOString(),
      uploadedBy: v.uploadedBy?.username || 'Unknown'
    })).sort((a, b) => b.version - a.version);

    res.json([latestVersion, ...oldVersions]);
  } catch (err) {
    console.error("Error fetching file versions:", err);
    res.status(500).json({ error: "Failed to fetch file versions" });
  }
});

// Download a specific file version by its unique ID
router.get("/download/:id", authenticateToken, async (req, res) => {
  try {
    const rootOwnerId = req.user.rootOwner;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Build file filter based on user role
    const fileFilter = { 
      _id: req.params.id, 
      rootOwner: rootOwnerId 
    };
    // if (req.user.role !== 'root') {
    //   fileFilter.uploadedBy = req.user._id;
    // }

    // First, check if the ID is for a main document (latest version)
    let file = await File.findOne(fileFilter);
    let versionData = file;

    // If not found, check if it's an ID for a sub-document (older version)
    if (!file) {
      const versionFilter = { 
        "versions._id": req.params.id, 
        rootOwner: rootOwnerId 
      };
      // if (req.user.role !== 'root') {
      //   versionFilter.uploadedBy = req.user._id;
      // }
      file = await File.findOne(versionFilter);
      if (file) {
        versionData = file.versions.find(v => v._id.toString() === req.params.id);
      }
    }

    if (!versionData) {
      return res.status(404).json({ error: "File version not found" });
    }

    // versionData.path stores the S3 key
    if (!BUCKET) return res.status(500).json({ error: 'S3 bucket not configured' });
    const key = versionData.path || versionData.savedName;
    if (!key) return res.status(404).json({ error: 'S3 key missing for file' });

    try {
      const getObj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      // Stream S3 object to response
      const stream = getObj.Body;
      const contentType = versionData.mimeType || file.mimeType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      // Use originalName for download filename
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      // Pipe stream directly
      stream.pipe(res);
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
      });
    } catch (err) {
      console.error('S3 download error:', err);
      return res.status(404).json({ error: 'File not found in S3' });
    }
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

// Delete a specific file version by its unique ID (root only or own files)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const rootOwnerId = req.user.rootOwner;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Build file filter based on user role
    const fileFilter = { 
      _id: req.params.id, 
      rootOwner: rootOwnerId 
    };
    // if (req.user.role !== 'root') {
    //   fileFilter.uploadedBy = req.user._id;
    // }

    const fileToDelete = await File.findOne(fileFilter);

    // CASE 1: The ID is for the LATEST version (the main document)
    if (fileToDelete) {
      // If there are no older versions, delete the whole document
      if (fileToDelete.versions.length === 0) {
        // Delete object from S3
        const key = fileToDelete.path || fileToDelete.savedName;
        if (BUCKET && key) {
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
          } catch (err) {
            console.error('S3 delete error:', err);
            // continue to delete metadata even if S3 delete failed
          }
        }
        // Delete embeddings associated with this fileId
        try {
          await Embedding.deleteMany({ fileId: fileToDelete._id });
        } catch (err) {
          console.error('Error deleting embeddings for file:', err);
        }
        await File.deleteOne({ _id: fileToDelete._id });
        return res.json({ message: `Deleted ${fileToDelete.originalName} completely.` });
      }

      // If there are older versions, promote the newest one
      fileToDelete.versions.sort((a, b) => b.versionNumber - a.versionNumber); // Ensure sorted by versionNumber
      const versionToPromote = fileToDelete.versions.shift(); // Get newest old version

      // Delete the old latest version's object from S3
      const oldKey = fileToDelete.path || fileToDelete.savedName;
      if (BUCKET && oldKey) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }));
        } catch (err) {
          console.error('S3 delete error (old latest):', err);
        }
      }

      // Update the main document with the promoted version's data
      fileToDelete.savedName = versionToPromote.savedName;
      fileToDelete.size = versionToPromote.size;
      fileToDelete.mimeType = versionToPromote.mimeType || fileToDelete.mimeType;
      fileToDelete.path = versionToPromote.path;
      fileToDelete.fileHash = versionToPromote.fileHash;
      fileToDelete.version = versionToPromote.versionNumber || versionToPromote.version;
      fileToDelete.uploadDate = versionToPromote.uploadDate || fileToDelete.uploadDate;
      // Reset AI processing status for the new content
      fileToDelete.aiProcessed = "pending";

      await fileToDelete.save();

      return res.json({ message: `Deleted latest version. Promoted v${fileToDelete.version} of ${fileToDelete.originalName}.` });
    }

    // CASE 2: The ID is for an OLDER version (a sub-document)
    const parentFilter = { 
      "versions._id": req.params.id, 
      rootOwner: rootOwnerId 
    };
    // if (req.user.role !== 'root') {
    //   parentFilter.uploadedBy = req.user._id;
    // }
    const parentFile = await File.findOne(parentFilter);
    if (parentFile) {
      const versionToDelete = parentFile.versions.find(v => v._id.toString() === req.params.id);
      if (!versionToDelete) return res.status(404).json({ error: "Version not found in parent" });

      // Delete the object from S3
      const key = versionToDelete.path || versionToDelete.savedName;
      if (BUCKET && key) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        } catch (err) {
          console.error('S3 delete error (subdoc):', err);
        }
      }

      // Delete embeddings for this specific versionNumber
      try {
        const verNum = versionToDelete.versionNumber || versionToDelete.version;
        if (verNum !== undefined && verNum !== null) {
          await Embedding.deleteMany({ fileId: parentFile._id, versionNumber: verNum });
        }
      } catch (err) {
        console.error('Error deleting embeddings for version:', err);
      }

      // Pull the version from the array in the DB
      await File.updateOne(
        { _id: parentFile._id },
        { $pull: { versions: { _id: versionToDelete._id } } }
      );

      return res.json({ message: `Deleted version ${versionToDelete.versionNumber || versionToDelete.version} of ${parentFile.originalName}` });
    }

    return res.status(404).json({ error: "File version not found" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;