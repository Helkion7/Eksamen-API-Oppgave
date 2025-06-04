const rateLimit = require("express-rate-limit");

// Skip rate limiting in test environment or for Postman
const isTestEnvironment = process.env.NODE_ENV === "test";

// Check if request is from Postman
const isPostmanRequest = (req) => {
  const userAgent = req.get("User-Agent") || "";
  return userAgent.toLowerCase().includes("postman");
};

// Bypass function for tests and Postman
const bypassRateLimit = (req, res, next) => next();

// General API rate limit
const apiLimiter = isTestEnvironment
  ? bypassRateLimit
  : rateLimit({
      windowMs: process.env.RATE_LIMIT_WINDOW_MS, // 15 minutes by default
      max: process.env.RATE_LIMIT_MAX_REQUESTS, // limit each IP to 100 requests per windowMs
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: { error: "Too many requests, please try again later" },
      skip: (req) => isPostmanRequest(req), // Skip rate limiting for Postman
    });

// Stricter rate limit for login attempts to prevent brute force attacks
const loginLimiter = isTestEnvironment
  ? bypassRateLimit
  : rateLimit({
      windowMs: process.env.LOGIN_RATE_LIMIT_WINDOW_MS, // 15 minutes
      max: process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS, // limit each IP to 5 login attempts per window
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many login attempts, please try again later" },
      skip: (req) => isPostmanRequest(req), // Skip rate limiting for Postman
    });

module.exports = {
  apiLimiter,
  loginLimiter,
};
