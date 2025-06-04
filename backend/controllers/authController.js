const argon2 = require("argon2");
const User = require("../models/User");
const { createTokenCookie } = require("../utils/jwtUtils");
const mongoose = require("mongoose");

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists - moved from validation to business logic
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Hash password with argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Create and set JWT cookie
    createTokenCookie(res, newUser._id);

    // Return user without password
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Verify password with argon2
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Create and set JWT cookie
    createTokenCookie(res, user._id);

    // Return user without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      message: "Login successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get all users (usernames only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("username").sort("username");

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get specific user by username
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Update user by username
const updateUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { email, password, role } = req.body;

    // Find the user to update
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Prepare update data
    const updateData = {};
    if (email) updateData.email = email;

    // Only admins can update role
    if (role && req.user.role === "admin") {
      updateData.role = role;
    }

    // Handle password update
    if (password) {
      updateData.password = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: parseInt(process.env.ARGON2_MEMORY_COST),
        timeCost: parseInt(process.env.ARGON2_TIME_COST),
        parallelism: parseInt(process.env.ARGON2_PARALLELISM),
      });
    }

    // Update the user
    const updatedUser = await User.findOneAndUpdate({ username }, updateData, {
      new: true,
    }).select("-password");

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Delete user by username (admin only)
const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;

    // Find the user to delete
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Only proceed if the current user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Only admins can delete users",
      });
    }

    // Prevent admin from deleting their own account
    if (req.user.username === username) {
      return res.status(400).json({
        error: "Admin cannot delete their own account",
      });
    }

    // Delete the user
    await User.findOneAndDelete({ username });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Check database connection
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: "Internal server error",
    });
  }
};

module.exports = {
  createUser,
  loginUser,
  getAllUsers,
  getUserByUsername,
  updateUser,
  deleteUser,
  healthCheck,
};
