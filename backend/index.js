const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = 5000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch((err) => console.error("❌ MongoDB Atlas connection error:", err));


// Middlewares
app.use(cors());
app.use(express.json());

// Serve uploaded static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route imports
const uploadRoute = require("./routes/upload");
const filesRoute = require("./routes/files"); // once implemented

// Route usage
app.use("/upload", uploadRoute);
app.use("/files", filesRoute); // once implemented

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
