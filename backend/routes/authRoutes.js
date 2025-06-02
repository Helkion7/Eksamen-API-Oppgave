const express = require("express");
const router = express.Router();
const {
  createUser,
  loginUser,
  getAllUsers,
  getUserByUsername,
  updateUser,
  deleteUser,
} = require("../controllers/authController");
const { protect, restrictTo } = require("../middleware/verifyJWT");

// Public routes
router.post("/users", createUser); // Create new user
router.post("/login", loginUser); // Login a user

// Protected routes
router.get("/users", protect, getAllUsers); // Get all users (usernames only)
router.get("/users/:username", protect, getUserByUsername); // Get specific user
router.put("/users/:username", protect, updateUser); // Update user - permissions handled in controller
router.delete("/users/:username", protect, restrictTo("admin"), deleteUser); // Delete user - admin only

module.exports = router;
