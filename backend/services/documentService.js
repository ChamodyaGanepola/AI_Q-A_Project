const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { chunkText } = require('../utils/chunkText');
const { storeDocument } = require('./ragService');

async function processDocument(filePath, fileName) {
  let text = '';

  if (fileName.endsWith('.pdf')) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    text = data.text;
  } else if (fileName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else {
    throw new Error('Unsupported file type');
  }

  // Split text into chunks
  const chunks = await chunkText(text);

  // Filter out empty chunks
  const validChunks = chunks.filter(chunk => chunk.trim() !== '');

  console.log(`Processing ${validChunks.length} chunks from ${fileName}`);

  // Store each chunk
  for (let i = 0; i < validChunks.length; i++) {
    const chunkId = `${fileName}_chunk_${i}`;
    try {
      await storeDocument(chunkId, validChunks[i], { source: fileName });
    } catch (error) {
      console.error(`Error storing chunk ${chunkId}:`, error.message);
    }
  }

  // Clean up file
  fs.unlinkSync(filePath);
}

module.exports = { processDocument };