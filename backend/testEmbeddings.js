const { processPDFForEmbeddings } = require('./services/embeddingProcessor');
const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  
  // Use a real file ID from your database
  await processPDFForEmbeddings('665f2c8a7c4a9e001e3f7c8a');
  
  mongoose.disconnect();
}

test();