const { index } = require("./pinecone.js");
const { getEmbedding } = require("./embeddings.js");

async function storeDocument(id, text) {
  const vector = await getEmbedding(text);

  await index.upsert([
    {
      id: id,
      values: vector,
      metadata: {
        text: text,
      },
    },
  ]);
}

async function searchDocs(query) {
  const vector = await getEmbedding(query);

  const result = await index.query({
    vector,
    topK: 3,
    includeMetadata: true,
  });

  return result.matches;
}

module.exports = { storeDocument, searchDocs };