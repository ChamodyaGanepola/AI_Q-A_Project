const { searchDocs } = require("../services/ragService");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chat = async (req, res) => {
  const { message } = req.body;

  try {
    // Search for relevant documents
    const matches = await searchDocs(message);

    // Check if we have relevant matches (lowered threshold to capture previous docs)
    const SIMILARITY_THRESHOLD = 0.3; // Lowered from 0.7 to include more documents
    const relevantMatches = matches.filter(m => m.score > SIMILARITY_THRESHOLD);

    console.log(`Total matches: ${matches.length}, Relevant matches: ${relevantMatches.length}`);
    console.log("All match scores:", matches.map(m => m.score));

    let answer;

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
    }

    res.json({ 
      reply: answer.choices[0].message.content,
      source: relevantMatches.length > 0 ? "documents" : "general",
      documentsUsed: relevantMatches.length,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
};

module.exports = { chat };