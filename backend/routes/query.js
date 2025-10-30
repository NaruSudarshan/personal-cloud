const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const File = require('../models/File');
const Embedding = require('../models/Embedding');
const { authenticateToken } = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Simplified vector math
const cosine = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return normA && normB ? dot / (normA * normB) : 0;
};

// Simplified KNN
const localKNN = async (queryVector, fileIds, k = 10) => {
    const candidates = await Embedding.find({ fileId: { $in: fileIds } }).lean();
    return candidates
        .map(c => ({ ...c, score: cosine(queryVector, c.vector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
};

// Simplified Groq call without complex fallback
const groqChat = async (messages, temperature = 0.3) => {
    return await groq.chat.completions.create({
        messages,
        model: GROQ_MODEL,
        temperature,
        max_tokens: 1024
    });
};

// Common function to get file map
const getFileMap = async (fileIds) => {
    const files = await File.find({ _id: { $in: fileIds } });
    return new Map(files.map(f => [f._id.toString(), f]));
};

// Main query endpoint
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const queryVector = await embeddings.embedQuery(query);
        
        // Get relevant chunks scoped to user's files
        const relevantChunks = await getRelevantChunks(query, queryVector, req.user.username);
        if (!relevantChunks.length) {
            return res.json({
                answer: "I couldn't find any information related to your question in your uploaded files.",
                sources: []
            });
        }

        const fileMap = await getFileMap([...new Set(relevantChunks.map(c => c.fileId))]);

        // Generate answer
        const context = relevantChunks.map(chunk => {
            const file = fileMap.get(chunk.fileId.toString());
            return `[SOURCE: ${file.originalName} v${file.version}]\n${chunk.text.slice(0, 500)}...`;
        }).join('\n\n');

        const chatCompletion = await groqChat([{
            role: "system",
            content: `Use ONLY the context below. Never mention chunks or internal structure. If unsure, say "I don't know".

CONTEXT:
${context}`
        }, {
            role: "user",
            content: query
        }]);

        // Prepare response
        const seenNames = new Set();
        const uniqueSources = relevantChunks.reduce((sources, chunk) => {
            const file = fileMap.get(chunk.fileId.toString());
            if (file && !seenNames.has(file.originalName)) {
                seenNames.add(file.originalName);
                sources.push({
                    fileId: file._id,
                    name: file.originalName,
                    version: file.version,
                    score: chunk.score,
                    textPreview: chunk.text.slice(0, 200) + '...'
                });
            }
            return sources;
        }, []);

        res.json({
            answer: chatCompletion.choices[0]?.message?.content || "No answer generated",
            sources: uniqueSources
        });

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Query processing failed' });
    }
});

// Summarize endpoint
router.post('/summarize', authenticateToken, async (req, res) => {
    try {
        const { fileName, fileId } = req.body;
        if (!fileName && !fileId) return res.status(400).json({ error: 'fileName or fileId is required' });

        const file = await File.findOne({
            ...(fileId ? { _id: fileId } : { originalName: fileName }),
            uploadedBy: req.user.username
        });
        if (!file) return res.status(404).json({ error: 'File not found' });

        const queryVector = await embeddings.embedQuery('Summarize the document');
        const fileEmbeds = await Embedding.find({ fileId: file._id }).lean();
        if (!fileEmbeds.length) return res.status(404).json({ error: 'No embeddings found' });

        // Get top chunks for summary
        const topChunks = fileEmbeds
            .map(c => ({ ...c, score: cosine(queryVector, c.vector) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);

        const context = topChunks.map(chunk => 
            `[SOURCE: ${file.originalName} v${file.version}]\n${chunk.text.slice(0, 1000)}`
        ).join('\n\n');

        const chatCompletion = await groqChat([{
            role: 'system',
            content: `Summarize the document below. If unsure, say "I don't know".\n\nCONTEXT:\n${context}`
        }, { 
            role: 'user', 
            content: `Please provide a concise summary of: ${file.originalName}` 
        }], 0.2);

        res.json({ 
            summary: chatCompletion.choices[0]?.message?.content || 'No summary generated',
            file: { id: file._id, name: file.originalName, version: file.version }
        });

    } catch (err) {
        console.error('Summarize error:', err);
        res.status(500).json({ error: 'Summarization failed' });
    }
});

// Helper function for chunk retrieval
async function getRelevantChunks(query, queryVector, username) {
    const userFiles = await File.find({ uploadedBy: username }).select('_id');
    if (!userFiles.length) return [];
    const fileIds = userFiles.map(f => f._id);

    try {
        const results = await Embedding.aggregate([
            {
                $search: {
                    index: "vectorSearch",
                    knnBeta: {
                        vector: queryVector,
                        k: 20,
                        path: "vector"
                    }
                }
            },
            { $match: { fileId: { $in: fileIds } } },
            { $limit: 20 },
            { $project: { score: { $meta: "searchScore" }, fileId: 1, text: 1 } }
        ]);
        if (results.length) return results;
    } catch (err) {
        console.warn('Atlas search failed, using local KNN:', err.message);
    }

    const knnResults = await localKNN(queryVector, fileIds, 20);
    return knnResults.map(k => ({ score: k.score, fileId: k.fileId, text: k.text }));
}

module.exports = router;