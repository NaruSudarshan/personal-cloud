// backend/index.js

// --- Imports ---
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Global Middleware ---
// IMPORTANT: Middleware must be defined BEFORE the routes that use them.
// 1. Enable CORS for all routes
app.use(cors());

// 2. Enable Express to parse JSON request bodies
app.use(express.json());

// 3. Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully."))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Route Imports ---
const filesRoute = require("./routes/files");
const uploadRoute = require("./routes/upload");
const queryRoute = require('./routes/query');

// --- API Route Definitions ---
// Use the '/api' prefix for all backend routes. This is a standard practice
// to avoid conflicts with frontend routes.
app.use("/api/files", filesRoute); // ✅ Corrected Path
app.use("/api/upload", uploadRoute);
app.use('/api/query', queryRoute);

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});