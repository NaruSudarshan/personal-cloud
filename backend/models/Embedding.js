const mongoose = require("mongoose");

const embeddingSchema = new mongoose.Schema({
  fileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "File", 
    required: true 
  },
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

module.exports = mongoose.model("Embedding", embeddingSchema);