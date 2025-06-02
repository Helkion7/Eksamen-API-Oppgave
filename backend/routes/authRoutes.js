const express = require("express");
const router = express.Router();
const {
  createUser,
  getUserByUsername,
  getAllUsernames,
} = require("../controllers/authController");

// GET /api/auth/users - Get all usernames (must come BEFORE the parameterized route)
router.get("/users", getAllUsernames);

// POST /api/auth/users - Create new user
router.post("/users", createUser);

// GET /api/auth/users/:username - Get user by username (must come AFTER the static route)
router.get("/users/:username", getUserByUsername);

module.exports = router;
