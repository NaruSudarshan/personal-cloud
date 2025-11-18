const mongoose = require('mongoose');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const Embedding = require('./models/Embedding');
const File = require('./models/File');
require('dotenv').config();

const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
});

async function testEmbeddings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test 1: Check if embeddings exist
        const totalEmbeddings = await Embedding.countDocuments();
        console.log(`📊 Total embeddings in database: ${totalEmbeddings}`);

        if (totalEmbeddings === 0) {
            console.log('❌ No embeddings found in database');
            return;
        }

        // Test 2: Check a sample embedding
        const sampleEmbedding = await Embedding.findOne();
        console.log(`📄 Sample embedding:`, {
            fileId: sampleEmbedding.fileId,
            chunkId: sampleEmbedding.chunkId,
            textLength: sampleEmbedding.text.length,
            vectorLength: sampleEmbedding.vector.length,
            textPreview: sampleEmbedding.text.substring(0, 100) + '...'
        });

        // Test 3: Test vector search
        const testQuery = "test";
        console.log(`🔍 Testing search with query: "${testQuery}"`);
        
        const queryVector = await embeddings.embedQuery(testQuery);
        console.log(`🧠 Query vector length: ${queryVector.length}`);

        const searchResults = await Embedding.aggregate([
            {
                $search: {
                    index: "vectorSearch",
                    knnBeta: {
                        vector: queryVector,
                        k: 5,
                        path: "vector"
                    }
                }
            },
            {
                $project: {
                    score: { $meta: "searchScore" },
                    fileId: 1,
                    chunkId: 1,
                    text: 1
                }
            }
        ]);

        console.log(`📊 Search results: ${searchResults.length} chunks found`);
        searchResults.forEach((result, index) => {
            console.log(`  ${index + 1}. Score: ${result.score.toFixed(4)}, Text: ${result.text.substring(0, 50)}...`);
        });

        // Test 4: Check files
        const files = await File.find({ aiProcessed: "ready" });
        console.log(`📁 Files with AI processing ready: ${files.length}`);
        files.forEach(file => {
            console.log(`  - ${file.originalName} (v${file.version})`);
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testEmbeddings();