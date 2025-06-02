const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid authentication token" });
  }
};

// Admin authorization middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Check if user is admin or is modifying their own account
const isAdminOrSameUser = (req, res, next) => {
  if (req.user.role === "admin" || req.user.username === req.params.username) {
    next();
  } else {
    res
      .status(403)
      .json({ error: "You do not have permission to update this user" });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isAdminOrSameUser,
};
