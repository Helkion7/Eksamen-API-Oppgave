const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

// Create Express app function
const createServer = () => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // Enable CORS
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production" ? "https://yourdomain.com" : true,
      credentials: true,
    })
  );

  // Parse JSON request body
  app.use(express.json());

  // Parse cookies
  app.use(cookieParser());

  // Routes
  app.use("/api", authRoutes);

  app.get("/", (req, res) => {
    res.send("API is running.");
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
};

// Connect to database and start server if this file is run directly
if (require.main === module) {
  const app = createServer();

  // Connect to MongoDB
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      const port = process.env.PORT;
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

module.exports = createServer;
