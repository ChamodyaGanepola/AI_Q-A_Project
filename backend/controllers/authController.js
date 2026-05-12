const { generateToken } = require("../utils/jwt");

const login = (req, res) => {
  const { email, password, role } = req.body;

  if (role === "admin" && email === "admin@test.com" && password === "1234") {
    const token = generateToken("admin-1", "admin", "Admin");
    return res.json({ token });
  }

  if (role === "user" && email === "user@test.com" && password === "1234") {
    const token = generateToken("user-2", "user", "User");
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
};

module.exports = { login };