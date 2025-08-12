// models/File.js
const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  savedName: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileHash: { type: String }
});

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  savedName: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String },
  path: { type: String, required: true },
  fileHash: { type: String },
  
  version: { type: Number, default: 1 },
  versions: [versionSchema],

  tags: [{ type: String }],
  aiProcessed: { 
    type: String, 
    enum: ["pending", "processing", "ready", "error"], 
    default: "pending" 
  },
  processingStartedAt: { type: Date },
  uploadedBy: { type: String, default: "root" },
  uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", fileSchema);
