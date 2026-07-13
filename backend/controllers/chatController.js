const Chat = require("../models/chatModel");
const { runSystem } = require("../services/systemAgent");

const GREETING_RE = /^(hi|hello|hey)\b/i;
const HOW_ARE_YOU_RE = /how are you/i;
const THANKS_RE = /thank you|thanks/i;
const WHO_RE = /who are you/i;

const isGreeting = (text) => GREETING_RE.test(text.trim());

function greetingReply(message) {
  if (HOW_ARE_YOU_RE.test(message)) {
    return "I'm doing well! How can I help you today?";
  }
  if (THANKS_RE.test(message)) {
    return "You're welcome!";
  }
  if (WHO_RE.test(message)) {
    return "I'm your AI assistant. I can help with documents, currency conversions, and more.";
  }
  return "Hello! How can I help you today?";
}

const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const trimmed = message.trim();

    const history = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("message reply")
      .lean();

    const messages = [
      ...history.reverse().flatMap((c) => [
        { role: "user", content: c.message },
        { role: "assistant", content: c.reply },
      ]),
      { role: "user", content: trimmed },
    ];

    if (isGreeting(trimmed)) {
      const reply = greetingReply(trimmed);
      await Chat.create({ userId, message: trimmed, reply });
      return res.json({ reply });
    }

    const rawReply = await runSystem(trimmed, messages);

    const normalizedReply =
      typeof rawReply === "string"
        ? rawReply
        : rawReply?.answer || JSON.stringify(rawReply);

    await Chat.create({
      userId,
      message: trimmed,
      reply: normalizedReply,
    });

    res.json({ reply: normalizedReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const [chatHistory, totalCount] = await Promise.all([
      Chat.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select("message reply createdAt")
        .lean(),
      Chat.countDocuments({ userId }),
    ]);

    res.json({
      chatHistory,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { processDocument } = require("../services/documentService");
    const result = await processDocument(file.path, file.originalname);

    res.json({
      success: true,
      message: "Document processed and stored",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process document" });
  }
};

module.exports = { chat, getChatHistory, uploadDocument };
