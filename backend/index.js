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
// 1. Enable CORS for allowed origins (supports multiple origins via ALLOWED_ORIGINS)
const rawAllowed = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
// ALLOWED_ORIGINS expected as comma-separated list, e.g.
// ALLOWED_ORIGINS=https://one-vault-eight.vercel.app,https://onevault.narusudarshan.com
const allowedOrigins = rawAllowed.split(",").map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // otherwise block
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 204, // some browsers need 204 for preflight
};

// Add Vary header so caches handle different origins correctly
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

// Use CORS for all routes and explicitly handle preflight
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight for all routes

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