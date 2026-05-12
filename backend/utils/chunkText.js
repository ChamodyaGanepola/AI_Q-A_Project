const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

async function chunkText(text, chunkSize = 1000, chunkOverlap = 200) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize,
    chunkOverlap: chunkOverlap,
  });

  const chunks = await splitter.splitText(text);
  return chunks;
}

module.exports = { chunkText };