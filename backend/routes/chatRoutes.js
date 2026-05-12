const express = require("express");
const { chat } = require("../controllers/chatController");
const { storeDocument } = require("../services/ragService");
const authMiddleware = require("../middlware/authMiddlware");

const router = express.Router();

router.post("/", authMiddleware, chat);

router.post("/store", authMiddleware, async (req, res) => {
  const { id, text } = req.body;

  await storeDocument(id, text);

  res.json({ success: true });
});

module.exports = router;