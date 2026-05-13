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

async function searchDocs(query) {
  const vector = await getEmbedding(query);

  const results = await index.query({
    vector,
    topK: 3,
    includeMetadata: true,
  });

  return results.matches;
}

module.exports = {
  storeDocument,
  searchDocs,
};