const { openai } = require("./openaiClient");

async function getEmbedding(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1024,
  });

  return res.data[0].embedding;
}

async function getEmbeddings(texts) {
  if (!texts.length) return [];

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
    dimensions: 1024,
  });

  return res.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

module.exports = { getEmbedding, getEmbeddings };
