const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const File = require('../models/File');
const Embedding = require('../models/Embedding');
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
});

router.post('/', async (req, res) => {
    try {
        const { query } = req.body;
        console.log(`🔍 Received search query: "${query}"`);
        if (!query) return res.status(400).json({ error: 'Query is required' });

        // Generate query embedding
        const queryVector = await embeddings.embedQuery(query);

        // Find most relevant chunks using Atlas Vector Search
        const relevantChunks = await Embedding.aggregate([
            {
                $search: {
                    index: "vectorSearch",
                    knnBeta: {
                        vector: queryVector,
                        k: 10,
                        path: "vector",
                        filter: {
                            text: {
                                query: query,
                                path: "text"
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    score: { $meta: "searchScore" },
                    fileId: 1,
                    chunkId: 1,
                    chunkIndex: 1,
                    text: 1
                }
            }
        ]);
        console.log(`📊 Found ${relevantChunks.length} relevant chunks`);
        // Get unique files from top chunks
        const fileIds = [...new Set(relevantChunks.map(c => c.fileId))];
        const files = await File.find({ _id: { $in: fileIds } });
        const fileMap = new Map(files.map(f => [f._id.toString(), f]));

        // Prepare context for LLM
        const context = relevantChunks.map(chunk => {
            const file = fileMap.get(chunk.fileId.toString());
            return `[SOURCE: ${file.originalName} v${file.version}]\n${chunk.text.slice(0, 500)}...`;
        }).join('\n\n');

        // Query Groq with context
        const chatCompletion = await groq.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are a helpful AI assistant. Answer the user's question using ONLY the context below. 

CRITICAL RULES:
1. NEVER mention chunk numbers, chunk references, or chunk divisions in your response
2. Provide clean, natural summaries without any chunk terminology
3. If unsure, say "I don't know"
4. Focus on the content and topics, not how the information is organized

CONTEXT:
${context}`
            }, {
                role: "user",
                content: query
            }],
            model: "llama3-70b-8192",
            temperature: 0.3,
            max_tokens: 1024
        });

        // Prepare response with unique sources by file name
        const seenNames = new Set();
        const uniqueSources = [];
        for (const chunk of relevantChunks) {
            const file = fileMap.get(chunk.fileId.toString());
            if (!file) continue;
            if (seenNames.has(file.originalName)) continue;
            seenNames.add(file.originalName);
            uniqueSources.push({
                fileId: file._id,
                chunkId: chunk.chunkId,
                name: file.originalName,
                version: file.version,
                score: chunk.score,
                textPreview: chunk.text.slice(0, 200) + '...'
            });
        }

        const response = {
            answer: chatCompletion.choices[0]?.message?.content || "No answer generated",
            sources: uniqueSources
        };
        console.log(`🧠 Generated answer: ${response.answer.substring(0, 100)}...`);

        res.json(response);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Query processing failed' });
    }
});

module.exports = router;