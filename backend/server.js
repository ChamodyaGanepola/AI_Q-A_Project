const { connectDB } = require("./config/db");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'JWT_SECRET',
  'PINECONE_API_KEY',
  'PINECONE_INDEX',
  'MONGODB_USERNAME',
  'MONGODB_PASSWORD'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

console.log("Environment variables validated successfully");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
connectDB();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});