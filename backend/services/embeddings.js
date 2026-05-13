const { openai } = require("./openaiService");

async function getEmbedding(text) {
 const res = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: text,
  dimensions: 1024,
});

  return res.data[0].embedding;
}

module.exports = { getEmbedding };