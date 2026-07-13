const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { chunkText } = require("../utils/chunkText");
const { storeDocuments } = require("./ragService");

async function extractText(filePath, fileName) {
  if (fileName.toLowerCase().endsWith(".pdf")) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || "";
  }

  if (fileName.toLowerCase().endsWith(".docx")) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  throw new Error("Unsupported file type");
}

async function processDocument(filePath, fileName) {
  try {
    const text = await extractText(filePath, fileName);
    const chunks = await chunkText(text);
    const validChunks = chunks.filter((chunk) => chunk.trim() !== "");

    const payload = validChunks.map((chunk, i) => ({
      id: `${fileName}_chunk_${i}`,
      text: chunk,
      metadata: { source: fileName },
    }));

    const stored = await storeDocuments(payload);
    return { chunks: validChunks.length, stored };
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = { processDocument };
