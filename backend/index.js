// backend/index.js

// --- Imports ---
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
require("dotenv").config();

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is required. Please update backend/.env');
  process.exit(1);
}

// --- Global Middleware ---
// IMPORTANT: Middleware must be defined BEFORE the routes that use them.
// 1. Enable CORS for all routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 2. Enable Express to parse JSON request bodies
app.use(express.json());

// 3. Enable cookie parser for JWT tokens
app.use(cookieParser());

// 4. Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully.");
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Route Imports ---
const filesRoute = require("./routes/files");
const uploadRoute = require("./routes/upload");
const queryRoute = require('./routes/query');
const authRoute = require('./routes/auth');
const dashboardRoute = require('./routes/dashboard');

// --- API Route Definitions ---
// Use the '/api' prefix for all backend routes. This is a standard practice
// to avoid conflicts with frontend routes.
app.use("/api/files", filesRoute);
app.use("/api/upload", uploadRoute);
app.use('/api/query', queryRoute);
app.use('/api/auth', authRoute);
app.use('/api/dashboard', dashboardRoute);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// --- Server Startup ---
// Export the app for serverless deployment
module.exports = app;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}