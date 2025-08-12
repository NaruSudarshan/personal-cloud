const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const path = require('path');
const File = require('../models/File');
const Embedding = require('../models/Embedding'); // Add this import

async function processPDFForEmbeddings(fileId) {
  try {
    const file = await File.findById(fileId);
    if (!file || file.mimeType !== 'application/pdf') return;

    const filePath = path.join(__dirname, '../uploads', file.savedName);
    
    // Load and split PDF text
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await splitter.splitDocuments(docs);
    
    // Generate embeddings for each chunk
    const chunkTexts = chunks.map(chunk => chunk.pageContent);
    const chunkVectors = await embeddings.embedDocuments(chunkTexts);
    
    // Save each chunk embedding to the database
    const embeddingPromises = chunks.map((chunk, index) => {
      return new Embedding({
        fileId,
        chunkId: `${fileId}_${index}`, // Unique chunk identifier
        chunkIndex: index,
        vector: chunkVectors[index],
        text: chunk.pageContent
      }).save();
    });

    await Promise.all(embeddingPromises);
    
    // Update file status
    file.aiProcessed = "ready";
    await file.save();
    
  } catch (error) {
    console.error(`Embedding processing failed: ${error}`);
    const file = await File.findById(fileId);
    if (file) {
      file.aiProcessed = "error";
      await file.save();
    }
  }
}

module.exports = { processPDFForEmbeddings };