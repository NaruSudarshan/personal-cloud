// routes/search.js
const express = require('express');
const { execSync } = require('child_process');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const router = express.Router();

// Use your venv's Python
const pythonPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.DB_NAME || "personal_cloud");
const embCol = db.collection("embeddings");
const filesCol = db.collection("files");

router.get('/', async (req, res) => {
  try {

    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // Get query embedding from Python (venv)
    const embeddingJson = execSync(
      `"${pythonPath}" embed_query.py "${query}"`,
      { encoding: 'utf-8' }
    );
    const queryVector = JSON.parse(embeddingJson);

    // Vector search in MongoDB Atlas
    const MIN_SCORE = 0.6;

    const results = await embCol.aggregate([
      {
        $vectorSearch: {
          queryVector,
          path: "vector",
          numCandidates: 150, // Increase candidates to find more potential matches
          limit: 20,          // << 1. Get a larger pool of top candidates
          index: "vector_index"
        }
      },
      {
        $project: {
          score: { $meta: "vectorSearchScore" },
          fileId: 1 // Pass the fileId to the next stage
        }
      },
      {
        // << 2. Filter for high-quality matches EARLY
        $match: {
          score: { $gte: MIN_SCORE }
        }
      },
      {
        $lookup: {
          from: "files",
          localField: "fileId",
          foreignField: "_id",
          as: "file"
        }
      },
      { $unwind: "$file" },
      {
        // Re-shape the final output
        $project: {
          _id: 0,
          score: 1,
          file: 1
        }
      },
      { $sort: { score: -1 } },
      { $limit: 5 } // << 3. Limit to the top 5 FINAL results
    ]).toArray();

    console.log('querying')
    res.json(results);

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
