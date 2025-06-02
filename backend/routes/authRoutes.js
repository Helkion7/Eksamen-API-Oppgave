const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/authController");

// POST /api/users - Create new user
router.post("/users", createUser);

module.exports = router;
