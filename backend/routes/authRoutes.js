const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  authenticate,
  isAdmin,
  isAdminOrSameUser,
} = require("../middleware/auth");
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
} = require("../middleware/validation");
const { apiLimiter, loginLimiter } = require("../middleware/rateLimit");

// Health check route (public)
router.get("/health", authController.healthCheck);

// Public routes
router.post(
  "/users",
  apiLimiter,
  validateUserRegistration,
  authController.createUser
);
router.post(
  "/login",
  loginLimiter,
  validateUserLogin,
  authController.loginUser
);

// Protected routes
router.get("/users", authenticate, apiLimiter, authController.getAllUsers);
router.get(
  "/users/:username",
  authenticate,
  apiLimiter,
  authController.getUserByUsername
);
router.put(
  "/users/:username",
  authenticate,
  isAdminOrSameUser,
  apiLimiter,
  validateUserUpdate,
  authController.updateUser
);
router.delete(
  "/users/:username",
  authenticate,
  isAdmin,
  apiLimiter,
  authController.deleteUser
);

module.exports = router;
