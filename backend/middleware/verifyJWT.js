const { verifyToken } = require("../utils/jwtUtils");
const User = require("../models/User");

// Middleware to verify if user is authenticated
const protect = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};

// Middleware to restrict access to admin only
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
