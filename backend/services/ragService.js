const { index } = require("./pinecone");
const { getEmbedding, getEmbeddings } = require("./embeddings");

const BATCH_SIZE = 50;

async function storeDocument(id, text, metadata = {}) {
  if (!text || text.trim() === "") return;

  const vector = await getEmbedding(text);

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
}

async function storeDocuments(chunks) {
  const valid = chunks.filter((chunk) => chunk?.text && chunk.text.trim() !== "");
  if (!valid.length) return 0;

  let stored = 0;

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE);
    const vectors = await getEmbeddings(batch.map((item) => item.text));

    const records = batch.map((item, idx) => ({
      id: item.id,
      values: vectors[idx],
      metadata: {
        text: item.text,
        ...(item.metadata || {}),
      },
    }));

    await index.upsert(records);
    stored += records.length;
  }

  return stored;
}

async function searchKnowledgeBase(query) {
  const vector = await getEmbedding(query);

  const results = await index.query({
    vector,
    topK: 5,
    includeMetadata: true,
  });

  const matches = results.matches || [];
  const filtered = matches.filter((m) => m.score >= 0.45);

  if (filtered.length === 0) return null;

  return filtered.map((m) => m.metadata?.text).join("\n\n");
}

module.exports = {
  storeDocument,
  storeDocuments,
  searchKnowledgeBase,
};
