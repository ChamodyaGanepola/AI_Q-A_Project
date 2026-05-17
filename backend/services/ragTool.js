const { index } = require("./pinecone");
const { getEmbedding } = require("./embeddings");

async function searchKnowledgeBase(query) {
  console.log("🔎 RAG QUERY:", query);

  const vector = await getEmbedding(query);

  const results = await index.query({
    vector,
    topK: 5,
    includeMetadata: true,
  });

  console.log(" PINECONE RESULTS:", results);

  const matches = results.matches || [];

  console.log("📌 MATCH COUNT:", matches.length);

  const filtered = matches.filter(m => {
    console.log("SCORE:", m.score);
    return m.score >=  0.45;
  });

  console.log("FILTERED COUNT:", filtered.length);

  if (filtered.length === 0) return null;

  return filtered.map(m => m.metadata?.text).join("\n\n");
}

module.exports = { searchKnowledgeBase };