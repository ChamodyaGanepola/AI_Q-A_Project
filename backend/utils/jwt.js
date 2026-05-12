const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

const generateToken = (userId, role, username) => {
  return jwt.sign({ userId, role, username }, SECRET, { expiresIn: "1d" });
};

const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { generateToken, verifyToken };