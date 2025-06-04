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

    console.log("Auth debug - Token exists:", !!token);
    console.log("Auth debug - Refresh token exists:", !!refreshToken);

    // If no access token, try to refresh
    if (!token && refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        console.log("Auth debug - Refresh token decoded:", decoded);

        const user = await User.findById(decoded.id).select("-password");
        console.log("Auth debug - User found from refresh:", !!user);

        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        // Create new access token
        token = createAccessTokenFromRefresh(res, user._id);
        req.user = user;
        return next();
      } catch (refreshError) {
        console.error(
          "Auth debug - Refresh token error:",
          refreshError.message
        );
        return res.status(401).json({ error: "Invalid refresh token" });
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyToken(token);
    console.log("Auth debug - Access token decoded:", decoded);

    const user = await User.findById(decoded.id).select("-password");
    console.log(
      "Auth debug - User found from access token:",
      !!user,
      user ? user.username : "none"
    );

    if (!user) {
      console.error("Auth debug - User not found for ID:", decoded.id);
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth debug - Main catch error:", error.message, error.name);

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
        console.error(
          "Auth debug - Fallback refresh error:",
          refreshError.message
        );
        return res.status(401).json({ error: "Invalid refresh token" });
      }
    }

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
