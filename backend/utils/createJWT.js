const jwt = require("jsonwebtoken");
require("dotenv").config();

async function createJWT(email, role) {
  const jwtToken = jwt.sign(
    { email: email, role: role },
    process.env.SECRET_KEY
  );
  return jwtToken;
}

module.exports = createJWT;
