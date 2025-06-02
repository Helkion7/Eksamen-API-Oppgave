const argon2 = require("argon2");
const User = require("../models/User");
const { createTokenCookie } = require("../utils/jwtUtils");

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
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
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 2 ** 16,
      timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 1,
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

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Return user without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: "User retrieved successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getAllUsernames = async (req, res) => {
  try {
    // Find all users but only return username field
    const users = await User.find({}, "username");

    // Extract just the usernames from the user objects
    const usernames = users.map((user) => user.username);

    res.status(200).json({
      message: "Usernames retrieved successfully",
      usernames: usernames,
      count: usernames.length,
    });
  } catch (error) {
    console.error("Error retrieving usernames:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  createUser,
  getUserByUsername,
  getAllUsernames,
};
