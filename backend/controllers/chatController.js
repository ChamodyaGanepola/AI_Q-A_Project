const { searchDocs } = require("../services/ragService");
const { openai, getAIResponseWithTools } = require("../services/openaiService");
const Chat = require("../models/chatModel");

// Pinecone score threshold — only treat as document match if score is above this
const SCORE_THRESHOLD = 0.5;

const chat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    // Fetch last 5 messages for conversation context
    const chatHistory = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("message reply");

    const conversationHistory = chatHistory.reverse();

    const conversationText = conversationHistory
      .map(c => `User: ${c.message}\nAssistant: ${c.reply}`)
      .join("\n\n");

    console.log("Previous conversation context loaded:", conversationText.substring(0, 200) + "...");

    let replyText;
    let source;
    let documentsUsed;

    // --- Greeting check ---
    const greetings = ["hi", "hello", "hey", "greetings", "howdy", "what can you do", "how can you assist"];
    const isGreeting = greetings.some(g => message.toLowerCase().includes(g));

    if (isGreeting) {
      console.log("Greeting detected");
      const answer = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a friendly and helpful assistant. Provide a brief, welcoming response about how you can assist the user.",
          },
          { role: "user", content: message },
        ],
      });
      replyText = answer.choices[0].message.content;
      source = "general";
      documentsUsed = 0;

    } else {

      // --- Step 1: Pinecone vector search ---
      console.log("Searching Pinecone...");
      const matches = await searchDocs(message);

      console.log(`Total matches found: ${matches ? matches.length : 0}`);
      if (matches && matches.length > 0) {
        console.log("Match scores:", matches.map(m => m.score));
      }

      const relevantMatches = (matches || []).filter(m => m.score >= SCORE_THRESHOLD);

      if (relevantMatches.length > 0) {
        // --- High score: Document-related → RAG answer ---
        console.log(`Found ${relevantMatches.length} relevant documents above threshold (${SCORE_THRESHOLD})`);
        const context = relevantMatches.map(m => m.metadata.text).join("\n");
        console.log("Context being sent to model:", context.substring(0, 300) + "...");

        const answer = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant. Answer ONLY based on the provided document context. Do not use general knowledge or information outside the provided context.

Always try to answer from the context provided. If you find relevant information in the context, extract and answer from it. Only say you cannot answer if the context truly has no relevant information whatsoever.

${conversationText ? `Previous conversation:\n${conversationText}` : ""}`,
            },
            {
              role: "user",
              content: `Context from documents:\n${context}\n\nQuestion: ${message}`,
            },
          ],
        });
        replyText = answer.choices[0].message.content;
        source = "documents";
        documentsUsed = relevantMatches.length;

      } else {
        // --- Low/no score: Try currency function calling ---
        // Build full conversation history as OpenAI messages so GPT understands follow-ups
        console.log(`No documents above threshold — trying currency function calling...`);

        const messages = [
          {
            role: "system",
            content: `You are a helpful assistant with access to live currency exchange tools.
Use the tools whenever the user asks about currency conversion, exchange rates, or anything money/currency related.
For follow-up questions (like "is that today's rate?", "what about now?"), use the conversation history to understand what currencies were discussed and call the appropriate tool.
If the question is clearly not currency related, do not call any tool.`,
          },
          // Inject previous conversation as alternating user/assistant messages
          // so GPT has full context for follow-ups
          ...conversationHistory.flatMap(c => [
            { role: "user", content: c.message },
            { role: "assistant", content: c.reply },
          ]),
          { role: "user", content: message },
        ];

        const { reply, usedTool, toolName } = await getAIResponseWithTools(messages);

        if (usedTool) {
          console.log(`Currency tool used: ${toolName}`);
          replyText = reply;
          source = "currency";
        } else {
          replyText = "I can't answer your question. I can only answer from uploaded documents or currency-related APIs.";
          source = "no_match";
        }
        documentsUsed = 0;
      }
    }

    // Save to MongoDB
    const chatMessage = new Chat({
      userId,
      message,
      reply: replyText,
      source,
      documentsUsed,
    });

    await chatMessage.save();
    console.log("Chat message saved to database");

    res.json({ reply: replyText, source, documentsUsed });

  } catch (error) {
    console.error("Chat error:", error);

    let errorMessage = "Failed to process chat message";
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status || 500;
      errorMessage = `OpenAI API error: ${error.response.status} - ${error.response.data?.error?.message || "Unknown API error"}`;
    } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      errorMessage = "Request timed out - please try again";
      statusCode = 408;
    } else if (error.message?.includes("API key")) {
      errorMessage = "OpenAI API key configuration error";
      statusCode = 500;
    } else {
      errorMessage = error.message || errorMessage;
    }

    res.status(statusCode).json({ error: errorMessage });
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
      .sort({ createdAt: 1 })
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