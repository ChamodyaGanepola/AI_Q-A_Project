const { searchDocs } = require("../services/ragService");
const { openai } = require("../services/openaiService");
const Chat = require("../models/chatModel");

const chat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user?.userId; // Get user ID from middleware

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    // Search for relevant documents
    const matches = await searchDocs(message);

    // Check if we have relevant matches (lowered threshold to capture previous docs)
    const SIMILARITY_THRESHOLD = 0.3; // Lowered from 0.7 to include more documents
    const relevantMatches = matches.filter(m => m.score > SIMILARITY_THRESHOLD);

    console.log(`Total matches: ${matches.length}, Relevant matches: ${relevantMatches.length}`);
    console.log("All match scores:", matches.map(m => m.score));

    let answer;
    let source;
    let documentsUsed;

    if (relevantMatches.length > 0) {
      // Document-based question: Answer only from Pinecone knowledge docs
      console.log(`Found ${relevantMatches.length} relevant documents`);
      
      const context = relevantMatches
        .map(m => m.metadata.text)
        .join("\n");

      console.log("Context being sent to model:", context.substring(0, 300) + "...");

      answer = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Use the provided context from documents to answer the question. Base your answer on the document context provided. If the context does not contain relevant information, you can say so, but try to use any related information from the context.",
          },
          {
            role: "user",
            content: `Context from documents:\n${context}\n\nQuestion: ${message}`,
          },
        ],
      });
      source = "documents";
      documentsUsed = relevantMatches.length;
    } else {
      // General question: Answer using OpenAI general knowledge (no document context)
      console.log("No relevant documents found, answering as general question");
      
      answer = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Answer the user's question based on your general knowledge.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      });
      source = "general";
      documentsUsed = 0;
    }

    const replyText = answer.choices[0].message.content;

    // Save chat message to MongoDB
    const chatMessage = new Chat({
      userId,
      message,
      reply: replyText,
      source,
      documentsUsed,
    });

    await chatMessage.save();
    console.log("Chat message saved to database");

    res.json({ 
      reply: replyText,
      source,
      documentsUsed,
    });
  } catch (error) {
    console.error("Chat error:", error);

    let errorMessage = "Failed to process chat message";
    let statusCode = 500;

    if (error.response) {
      // OpenAI API error
      statusCode = error.response.status || 500;
      errorMessage = `OpenAI API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown API error'}`;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = "Request timed out - please try again";
      statusCode = 408;
    } else if (error.message?.includes('API key')) {
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

    // Get chat messages for the user, sorted by oldest first for chat flow
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