require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
});

const getAIResponse = async (message) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Updated to match chatController
    messages: [{ role: "user", content: message }],
  });

  return response.choices[0].message.content;
};

module.exports = { openai, getAIResponse };