const { index } = require("./pinecone");
const { getEmbedding } = require("./embeddings");

async function storeDocument(id, text, metadata = {}) {
  if (!text || text.trim() === "") return;

  const vector = await getEmbedding(text);

  console.log("Uploading:", id);

  await index.upsert([
    {
      id,
      values: vector,
      metadata: {
        text,
        ...metadata,
      },
    },
  ]);

  console.log("Stored successfully");
}


async function searchKnowledgeBase(query) {

  const vector = await getEmbedding(query);

  const results = await index.query({
    vector,
    topK: 5,
    includeMetadata: true,
  });

  const matches = results.matches || [];

  const filtered = matches.filter(m => m.score >= 0.45);

  if (filtered.length === 0) return null;

  return filtered.map(m => m.metadata?.text).join("\n\n");
}

module.exports = {
  storeDocument,
  searchKnowledgeBase,
};