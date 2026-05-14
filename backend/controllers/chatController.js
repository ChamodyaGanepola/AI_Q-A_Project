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
    // Fetch user's chat history (last 5 messages for context)
    const chatHistory = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('message reply');
    
    const conversationHistory = chatHistory
      .reverse()
      .map(chat => `User: ${chat.message}\nAssistant: ${chat.reply}`)
      .join("\n\n");

    console.log("Previous conversation context loaded:", conversationHistory.substring(0, 200) + "...");

    // Check if message is a greeting FIRST
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy', 'what can you do', 'how can you assist'];
    const isGreeting = greetings.some(g => message.toLowerCase().includes(g));

    let answer;
    let source;
    let documentsUsed;

    if (isGreeting) {
      // Greeting detected: Allow general friendly response without searching documents
      console.log("Greeting detected, providing general assistance message");
      
      answer = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a friendly and helpful assistant. Provide a brief, welcoming response about how you can assist the user.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      });
      source = "general";
      documentsUsed = 0;
    } else {
      // Not a greeting: Search for relevant documents
      const matches = await searchDocs(message);

      // Use all matches if available
      const relevantMatches = matches && matches.length > 0 ? matches : [];

      console.log(`Total matches found: ${matches ? matches.length : 0}`);
      if (matches && matches.length > 0) {
        console.log("Match scores:", matches.map(m => m.score));
      }

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
              content: `You are a helpful assistant. Answer ONLY based on the provided document context. Do not use general knowledge or information outside the provided context. 

Always try to answer from the context provided. If you find relevant information in the context, extract and answer from it. Only say you cannot answer if the context truly has no relevant information whatsoever.

${conversationHistory ? `Previous conversation:\n${conversationHistory}` : ''}`,
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
        // No relevant documents found: Return unable to answer message
        console.log("No relevant documents found, unable to answer the question");
        
        answer = {
          choices: [
            {
              message: {
                content: "I can't answer your question"
              }
            }
          ]
        };
        source = "no_match";
        documentsUsed = 0;
      }
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