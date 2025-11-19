const { pipeline: streamPipeline } = require('stream');
const { promisify } = require('util');
const fs = require('fs');
async function processPDFForEmbeddings(fileId, rootOwnerId) {
  try {
    // console.log(`🏁 Starting embedding processing for file: ${fileId} for rootOwner: ${rootOwnerId}`);

    // Find file with rootOwner check for security
    const file = await File.findOne({ _id: fileId, rootOwner: rootOwnerId });
    if (!file || file.mimeType !== 'application/pdf') {
      // console.log(`⏩ Skipping non-PDF or unauthorized file: ${fileId}`);
      return;
    }

    // console.log("File found:", !!file);

    // mark processing started
    try {
      file.aiProcessed = 'processing';
      file.processingStartedAt = new Date();
      await file.save();
    } catch (e) {
      console.warn('Could not update file processing status:', e);
    }

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
      // console.log(`⤓ Downloading PDF from S3: ${process.env.S3_BUCKET}/${key}`);
      const getObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
      const bodyStream = getObj.Body;

      // stream to file
      await pump(bodyStream, fs.createWriteStream(localFilePath));
      // console.log(`✅ Downloaded PDF to ${localFilePath}`);
    } else {
      // console.log(`ℹ️ Using cached local PDF: ${localFilePath}`);
    }

    // Load and split PDF text
    const loader = new PDFLoader(localFilePath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitDocuments(docs);
    // console.log(`📄 Split PDF into ${chunks.length} chunks`);
    // console.log("Number of chunks:", chunks.length);
    if (chunks.length === 0) {
      console.warn("⚠️ No text extracted from PDF");
      return;
    }

    // Generate embeddings for each chunk
    const chunkTexts = chunks.map(chunk => chunk.pageContent);
    const chunkVectors = await embeddings.embedDocuments(chunkTexts); // ✅ Now initialized
    // console.log(`🧠 Generated embeddings for ${chunkVectors.length} chunks`);
    // console.log("Generated vectors:", chunkVectors.length);
    // console.log("Vector dimension:", chunkVectors[0]?.length || 0);

    // Save each chunk embedding to the database (include versionNumber and rootOwner)
    const embeddingDocs = chunks.map((chunk, index) => ({
      fileId,
      rootOwner: rootOwnerId, // Add rootOwner for data isolation
      versionNumber: file.version,
      chunkId: `${fileId}_${index}`,
      chunkIndex: index,
      vector: chunkVectors[index],
      text: chunk.pageContent
    }));

    // console.log(`💾 Saving ${embeddingDocs.length} embeddings for file '${file.originalName}' (id=${fileId}, version=${file.version}, rootOwner=${rootOwnerId})`);

    // Use allSettled so we can log per-item failures without aborting the whole process
    const savePromises = embeddingDocs.map(d => new Embedding(d).save());
    const results = await Promise.allSettled(savePromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureDetails = results
      .map((r, idx) => ({ r, idx }))
      .filter(x => x.r.status === 'rejected')
      .map(x => ({ index: x.idx, reason: x.r.reason && x.r.reason.message ? x.r.reason.message : String(x.r.reason) }));

    // console.log(`💾 Embeddings save complete: ${successCount}/${results.length} succeeded`);
    if (failureDetails.length > 0) {
      console.error('❌ Some embeddings failed to save:', failureDetails.slice(0, 10));
    }

    // Update file status
    file.aiProcessed = "ready";
    await file.save();
    // console.log(`✅ Completed embedding processing for file: ${fileId}`);

    // Clean up local file after processing
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        // console.log(`🧹 Cleaned up local file: ${localFilePath}`);
      }
    } catch (cleanupError) {
      console.warn('Could not clean up local file:', cleanupError.message);
    }

  } catch (error) {
    console.error(`❌ Embedding processing failed: ${error}`);
    const file = await File.findOne({ _id: fileId, rootOwner: rootOwnerId });
    if (file) {
      file.aiProcessed = "error";
      await file.save();
    }
  }
}

const MAX_RETRIES = 3;

async function processPDFWithRetry(fileId, rootOwnerId, attempt = 1) {
  try {
    await processPDFForEmbeddings(fileId, rootOwnerId);
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      // console.log(`🔄 Retrying embedding processing (attempt ${attempt})`);
      setTimeout(() => processPDFWithRetry(fileId, rootOwnerId, attempt + 1), 5000 * attempt);
    }
  }
}

module.exports = {
  processPDFForEmbeddings,
  processPDFWithRetry
};