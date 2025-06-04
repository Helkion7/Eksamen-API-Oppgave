const {
  verifyToken,
  verifyRefreshToken,
  createAccessTokenFromRefresh,
} = require("../utils/jwtUtils");
const User = require("../models/User");

// Middleware to verify if user is authenticated
const protect = async (req, res, next) => {
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
        return res
          .status(401)
          .json({ error: "Not authorized, invalid refresh token" });
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Set user in request object
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
        return res
          .status(401)
          .json({ error: "Not authorized, invalid refresh token" });
      }
    }

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
