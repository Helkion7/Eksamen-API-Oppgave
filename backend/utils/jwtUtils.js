const jwt = require("jsonwebtoken");

const createTokenCookie = (res, userId) => {
  // Create token
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  // Set cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Cannot be accessed by client-side JS
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
    sameSite: "strict",
  };

  // Set cookie
  res.cookie("jwt", token, cookieOptions);

  return token;
};

module.exports = {
  createTokenCookie,
};
