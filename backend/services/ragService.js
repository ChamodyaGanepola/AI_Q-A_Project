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

  console.log("Search results for query:", query);
  console.log("Total matches found:", results.matches.length);
  results.matches.forEach((match, idx) => {
    console.log(`Match ${idx}:`, {
      id: match.id,
      score: match.score,
      textPreview: match.metadata?.text?.substring(0, 100),
    });
  });

  return results.matches;
}

module.exports = {
  storeDocument,
  searchDocs,
};