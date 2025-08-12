const mongoose = require("mongoose");

const embeddingSchema = new mongoose.Schema({
  fileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "File", 
    required: true 
  },
  chunkId: { type: String, required: true }, // Unique identifier for each chunk
  chunkIndex: { type: Number, required: true }, // Position of chunk in document
  vector: { type: [Number], required: true },
  text: { type: String, required: true }, // Store chunk text
  model: { type: String, default: "all-MiniLM-L6-v2" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Embedding", embeddingSchema);