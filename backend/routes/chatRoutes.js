const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  chat,
  getChatHistory,
  uploadDocument,
} = require("../controllers/chatController");
const { storeDocument } = require("../services/ragService");
const authMiddleware = require("../middlware/authMiddlware");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf" || ext === ".docx") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF and DOCX files are allowed"));
  },
});

router.post("/", authMiddleware, chat);
router.get("/history", authMiddleware, getChatHistory);

router.post("/store", authMiddleware, async (req, res) => {
  try {
    const { id, text } = req.body;
    if (!id || !text) {
      return res.status(400).json({ error: "id and text are required" });
    }
    await storeDocument(id, text);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to store document" });
  }
});

router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    upload.single("document")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  uploadDocument
);

module.exports = router;
