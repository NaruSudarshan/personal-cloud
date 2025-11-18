const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  savedName: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  mimeType: { type: String },
  uploadDate: { type: Date, default: Date.now },
  fileHash: { type: String },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const fileSchema = new mongoose.Schema({
  rootOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  },
  originalName: { type: String, required: true },
  savedName: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String },
  path: { type: String, required: true },
  fileHash: { type: String },
  
  version: { type: Number, default: 1 },
  versions: [versionSchema],

  tags: [{ type: String }],
  summary: { type: String },
  extractedText: { type: String },
  aiProcessed: { 
    type: String, 
    enum: ["pending", "processing", "ready", "error"], 
    default: "pending" 
  },
  processingStartedAt: { type: Date },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  uploadDate: { type: Date, default: Date.now }
});

// Compound index for efficient querying by rootOwner and other fields
fileSchema.index({ rootOwner: 1, uploadedBy: 1 });
fileSchema.index({ rootOwner: 1, uploadDate: -1 });
fileSchema.index({ uploadedBy: 1, uploadDate: -1 });

// Static method to find files accessible by a user
fileSchema.statics.findByUser = function(userId, rootOwnerId) {
  return this.find({ 
    rootOwner: rootOwnerId 
  });
};

// Static method to find files uploaded by a specific user
fileSchema.statics.findByUploader = function(userId) {
  return this.find({ uploadedBy: userId });
};

module.exports = mongoose.model("File", fileSchema);