const Chat = require("../models/chatModel");
const { runAgent } = require("../services/agentService");

const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    // Last messages
    const history = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const messages = [
      {
  role: "system",
  content: `
You are a document-based AI assistant.

You MUST use the search_knowledge_base tool when answering document-related questions.

If the tool returns no results, say:
"I could not find this information in the uploaded documents."

You may use chat history when relevant.
`
},
      ...history.reverse().flatMap((c) => [
        { role: "user", content: c.message },
        { role: "assistant", content: c.reply },
      ]),

      {
        role: "user",
        content: message,
      },
    ];

    const reply = await runAgent(messages);

    await Chat.create({
      userId,
      message,
      reply,
    });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
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