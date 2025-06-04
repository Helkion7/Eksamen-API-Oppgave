const jwt = require("jsonwebtoken");

const createTokenCookie = (res, userId) => {
  // Create access token (short-lived)
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // Create refresh token (long-lived)
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    }
  );

  // Set access token cookie options
  const accessCookieOptions = {
    expires: new Date(
      Date.now() +
        parseFloat(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Set refresh token cookie options
  const refreshCookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN) *
          24 *
          60 *
          60 *
          1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Set cookies
  res.cookie("jwt", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const createAccessTokenFromRefresh = (res, userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const accessCookieOptions = {
    expires: new Date(
      Date.now() +
        parseFloat(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("jwt", accessToken, accessCookieOptions);
  return accessToken;
};

module.exports = {
  createTokenCookie,
  verifyToken,
  verifyRefreshToken,
  createAccessTokenFromRefresh,
};
