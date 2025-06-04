const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  verifyToken,
  verifyRefreshToken,
  createAccessTokenFromRefresh,
} = require("../utils/jwtUtils");

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;
    const refreshToken = req.cookies.refreshToken;

    // If no access token, try to refresh
    if (!token && refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        // Create new access token
        token = createAccessTokenFromRefresh(res, user._id);
        req.user = user;
        return next();
      } catch (refreshError) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    // If access token is expired, try refresh token
    if (error.name === "TokenExpiredError" && req.cookies.refreshToken) {
      try {
        const decoded = verifyRefreshToken(req.cookies.refreshToken);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        // Create new access token
        createAccessTokenFromRefresh(res, user._id);
        req.user = user;
        return next();
      } catch (refreshError) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
    }

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
