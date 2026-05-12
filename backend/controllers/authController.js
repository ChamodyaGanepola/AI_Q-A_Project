const { generateToken } = require("../utils/jwt");

const login = (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@test.com" && password === "1234") {
    const token = generateToken("user-1");
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
};

module.exports = { login };