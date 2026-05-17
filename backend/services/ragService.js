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

module.exports = {
  storeDocument,

};