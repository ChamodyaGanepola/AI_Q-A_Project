const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbedding(text) {
 const res = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: text,
  dimensions: 1024,
});

  return res.data[0].embedding;
}

module.exports = { getEmbedding };