const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const path = require('path');
const File = require('../models/File');
const Embedding = require('../models/Embedding');
const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { pipeline: streamPipeline } = require('stream');
const { promisify } = require('util');
const pump = promisify(streamPipeline);
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
    console.log("File found:", !!file);

    // PDFLoader expects a local path. If file.path points to an S3 key, download it to uploads/ and use that path.
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const localFilePath = path.join(uploadsDir, file.savedName);

    // If local file already exists (old records or prior download), reuse it. Otherwise try to download from S3.
    if (!fs.existsSync(localFilePath)) {
      if (!process.env.S3_BUCKET || !process.env.AWS_REGION) {
        throw new Error('Missing S3 configuration for downloading PDF');
      }

      const s3 = new S3Client({ region: process.env.AWS_REGION });
      const key = file.path; // we store S3 key in file.path
      console.log(`⤓ Downloading PDF from S3: ${process.env.S3_BUCKET}/${key}`);
      const getObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
      const bodyStream = getObj.Body;

      // stream to file
      await pump(bodyStream, fs.createWriteStream(localFilePath));
      console.log(`✅ Downloaded PDF to ${localFilePath}`);
    } else {
      console.log(`ℹ️ Using cached local PDF: ${localFilePath}`);
    }

    // Load and split PDF text
    const loader = new PDFLoader(localFilePath);
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
    // Save each chunk embedding to the database (include versionNumber)
    const embeddingPromises = chunks.map((chunk, index) => {
      return new Embedding({
        fileId,
        versionNumber: file.version,
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