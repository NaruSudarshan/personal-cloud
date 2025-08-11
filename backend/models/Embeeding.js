// models/Embedding.js
const mongoose = require("mongoose");

const embeddingSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  versionNumber: { type: Number, required: true },
  vector: { type: [Number], required: true },
  model: { type: String, default: "all-MiniLM-L6-v2" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Embedding", embeddingSchema);
