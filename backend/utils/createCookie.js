require("dotenv").config();

async function createCookie(res, jwtToken) {
  res.cookie("jwt", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: true,
  });
}

module.exports = createCookie;
