const express = require('express');
const router = express.Router();
const File = require('../models/File');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get total files count and size
    const files = await File.find({});
    const totalFiles = files.length;
    const totalStorageBytes = files.reduce((acc, file) => acc + file.size, 0);
    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

    // Calculate storage usage percentage (assuming 100GB total storage)
    const totalStorageGB = 100 * 1024 * 1024 * 1024; // 100 GB in bytes
    const storageUsage = Math.min(100, (totalStorageBytes / totalStorageGB * 100).toFixed(1));

    // Get active users (not expired and isActive true)
    const activeUsers = await User.countDocuments({
      isActive: true,
      expiryTime: { $gt: new Date() }
    });

    // Get recent files with upload info
    const recentFiles = await File.find({})
      .sort({ uploadDate: -1 })
      .limit(5)
      .select('originalName mimeType size uploadDate uploadedBy aiProcessed');

    // Get AI processing status counts
    const aiStatusCounts = await File.aggregate([
      {
        $group: {
          _id: '$aiProcessed',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get file type distribution
    const fileTypeDistribution = await File.aggregate([
      {
        $group: {
          _id: { $arrayElemAt: [{ $split: ["$mimeType", "/"] }, 1] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Convert to object format
    const fileTypes = {};
    fileTypeDistribution.forEach(type => {
      fileTypes[type._id || 'other'] = type.count;
    });

    // Convert AI status counts to proper object
    const aiProcessing = {};
    aiStatusCounts.forEach(item => {
      aiProcessing[item._id] = item.count;
    });

    res.json({
      stats: {
        totalFiles,
        totalStorage: `${totalStorageMB} MB`,
        activeUsers,
        aiProcessing
      },
      recentFiles: recentFiles.map(file => ({
        name: file.originalName,
        type: file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: file.uploadDate,
        uploadedBy: file.uploadedBy,
        status: file.aiProcessed
      })),
      storageUsage,
      fileTypes
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;