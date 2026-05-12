const express = require("express");
const multer = require("multer");
const { chat } = require("../controllers/chatController");
const { storeDocument } = require("../services/ragService");
const { processDocument } = require("../services/documentService");
const authMiddleware = require("../middlware/authMiddlware");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post("/", authMiddleware, chat);

router.post("/store", authMiddleware, async (req, res) => {
  const { id, text } = req.body;

  await storeDocument(id, text);

  res.json({ success: true });
});

// New route for uploading documents
router.post("/upload", authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    await processDocument(file.path, file.originalname);

    res.json({ success: true, message: 'Document processed and stored' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

module.exports = router;