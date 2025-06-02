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

// Public routes
router.post("/users", validateUserRegistration, authController.createUser);
router.post("/login", validateUserLogin, authController.loginUser);

// Protected routes
router.get("/users", authenticate, authController.getAllUsers);
router.get("/users/:username", authenticate, authController.getUserByUsername);
router.put(
  "/users/:username",
  authenticate,
  isAdminOrSameUser,
  validateUserUpdate,
  authController.updateUser
);
router.delete(
  "/users/:username",
  authenticate,
  isAdmin,
  authController.deleteUser
);

module.exports = router;
