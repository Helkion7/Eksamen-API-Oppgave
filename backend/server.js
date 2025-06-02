const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Create Express app function
const createServer = () => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  const authRoutes = require("./routes/authRoutes");
  app.use("/api", authRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Server error" });
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
      const port = process.env.PORT || 3000;
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
