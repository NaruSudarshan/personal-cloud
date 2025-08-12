const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const path = require('path');
const File = require('../models/File');
const Embedding = require('../models/Embedding');
const { pipeline } = require('@xenova/transformers');
console.log("Transformers pipeline initialized:", !!pipeline);

// Initialize embeddings model ✅
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: 'Xenova/all-MiniLM-L6-v2',
});

async function processPDFForEmbeddings(fileId) {
  try {
    console.log(`🏁 Starting embedding processing for file: ${fileId}`);
    const file = await File.findById(fileId);
    if (!file || file.mimeType !== 'application/pdf') {
      console.log(`⏩ Skipping non-PDF file: ${fileId}`);
      return;
    }
    
    const filePath = path.join(__dirname, '../uploads', file.savedName);
    console.log("File found:", !!file);
    console.log("File path:", filePath);

    // Load and split PDF text
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitDocuments(docs);
    console.log(`📄 Split PDF into ${chunks.length} chunks`);
    console.log("Number of chunks:", chunks.length);
    if (chunks.length === 0) {
      console.warn("⚠️ No text extracted from PDF");
      return;
    }

    // Generate embeddings for each chunk
    const chunkTexts = chunks.map(chunk => chunk.pageContent);
    const chunkVectors = await embeddings.embedDocuments(chunkTexts); // ✅ Now initialized
    console.log(`🧠 Generated embeddings for ${chunkVectors.length} chunks`);
    console.log("Generated vectors:", chunkVectors.length);
    console.log("Vector dimension:", chunkVectors[0]?.length || 0);
    // Save each chunk embedding to the database
    const embeddingPromises = chunks.map((chunk, index) => {
      return new Embedding({
        fileId,
        chunkId: `${fileId}_${index}`,
        chunkIndex: index,
        vector: chunkVectors[index],
        text: chunk.pageContent
      }).save();
    });

    await Promise.all(embeddingPromises);
    console.log(`💾 Saved ${embeddingPromises.length} embeddings to database`);

    // Update file status
    file.aiProcessed = "ready";
    await file.save();
    console.log(`✅ Completed embedding processing for file: ${fileId}`);

  } catch (error) {
    console.error(`❌ Embedding processing failed: ${error}`);
    const file = await File.findById(fileId);
    if (file) {
      file.aiProcessed = "error";
      await file.save();
    }
  }
}

module.exports = {
  processPDFForEmbeddings,
  processPDFWithRetry
};

const MAX_RETRIES = 3;

async function processPDFWithRetry(fileId, attempt = 1) {
  try {
    await processPDFForEmbeddings(fileId);
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      console.log(`🔄 Retrying embedding processing (attempt ${attempt})`);
      setTimeout(() => processPDFWithRetry(fileId, attempt + 1), 5000 * attempt);
    }
  }
}