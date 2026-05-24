const Chat = require("../models/chatModel");
const { runSystem } = require("../services/systemAgent");



const isGreeting = (text) =>
  /^(hi|hello|hey)\b/i.test(text.trim());

const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    const history = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const messages = [
      ...history.reverse().flatMap((c) => [
        { role: "user", content: c.message },
        { role: "assistant", content: c.reply },
      ]),
      { role: "user", content: message },
    ];

    if (isGreeting(message)) {
      let reply = "Hello! How can I help you today?";

      if (/how are you/i.test(message)) {
        reply = "I'm doing well! How can I help you today?";
      }

      if (/thank you|thanks/i.test(message)) {
        reply = "You're welcome!";
      }

      if (/who are you/i.test(message)) {
        reply =
          "I'm your AI assistant. I can help with documents, currency conversions, and more.";
      }
      await Chat.create({ userId, message, reply });
      return res.json({ reply });
    }

    const rawReply = await runSystem(message, messages);

    const normalizedReply =
      typeof rawReply === "string"
        ? rawReply
        : rawReply?.answer || JSON.stringify(rawReply);

    await Chat.create({
      userId,
      message,
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

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const chatHistory = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    const totalCount = await Chat.countDocuments({ userId });

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

module.exports = { chat, getChatHistory };