const mongoose = require("mongoose");

const embeddingSchema = new mongoose.Schema({
  fileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "File", 
    required: true 
  },
  rootOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  },
  versionNumber: { type: Number, required: true },
  chunkId: { type: String, required: true }, 
  chunkIndex: { type: Number, required: true },
  vector: { 
    type: [Number], 
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 384;
      },
      message: props => `Vector must have 384 dimensions, got ${props.value.length}`
    }
  },
  text: { type: String, required: true }, 
  model: { type: String, default: "all-MiniLM-L6-v2" },
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient querying by rootOwner
embeddingSchema.index({ rootOwner: 1, fileId: 1 });
embeddingSchema.index({ fileId: 1, chunkIndex: 1 });

module.exports = mongoose.model("Embedding", embeddingSchema);