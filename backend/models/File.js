const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: String,         // test.txt
  savedName: String,            // 123456-test.txt
  size: Number,
  path: String,
  version: Number,              // version number
  uploadDate: { type: Date, default: Date.now },
});

fileSchema.index({ originalName: 1, version: -1 }); // Index for faster lookups

module.exports = mongoose.model("File", fileSchema);
