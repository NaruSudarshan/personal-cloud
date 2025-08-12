const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const File = require('../models/File');
const Embedding = require('../models/Embedding'); // Add this import
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: 'Xenova/all-MiniLM-L6-v2',
});

// Cosine similarity calculation
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
};

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    // Generate query embedding
    const queryVector = await embeddings.embedQuery(query);

    // Find most relevant chunks
    const allChunks = await Embedding.find({});
    
    const scoredChunks = allChunks.map(chunk => ({
      ...chunk.toObject(),
      score: cosineSimilarity(queryVector, chunk.vector)
    })).sort((a, b) => b.score - a.score).slice(0, 10); // Top 10 chunks

    // Get unique files from top chunks
    const fileIds = [...new Set(scoredChunks.map(c => c.fileId))];
    const files = await File.find({ _id: { $in: fileIds } });
    const fileMap = new Map(files.map(f => [f._id.toString(), f]));

    // Prepare context for LLM
    const context = scoredChunks.map(chunk => {
      const file = fileMap.get(chunk.fileId.toString());
      return `[SOURCE: ${file.originalName} v${file.version}]\n` +
             `Chunk ${chunk.chunkIndex + 1}:\n${chunk.text.slice(0, 500)}...`;
    }).join('\n\n');

    // Query Groq with context
    const chatCompletion = await groq.chat.completions.create({
      messages: [{
        role: "system",
        content: `Answer user's question using ONLY context below. ` +
                 `If unsure, say "I don't know".\n\nCONTEXT:\n${context}`
      }, {
        role: "user",
        content: query
      }],
      model: "llama3-70b-8192",
      temperature: 0.3,
      max_tokens: 1024
    });

    // Prepare response with sources
    const response = {
      answer: chatCompletion.choices[0]?.message?.content || "No answer generated",
      sources: scoredChunks.map(chunk => {
        const file = fileMap.get(chunk.fileId.toString());
        return {
          fileId: file._id,
          chunkId: chunk.chunkId,
          name: file.originalName,
          version: file.version,
          score: chunk.score,
          textPreview: chunk.text.slice(0, 200) + '...'
        }
      })
    };

    res.json(response);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Query processing failed' });
  }
});

module.exports = router;