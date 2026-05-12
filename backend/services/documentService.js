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

  // Store each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${fileName}_chunk_${i}`;
    await storeDocument(chunkId, chunks[i], { source: fileName });
  }

  // Clean up file
  fs.unlinkSync(filePath);
}

module.exports = { processDocument };