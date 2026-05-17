const OpenAI = require("openai");
const { TOOLS } = require("../tools/toolDefinitions");
const { searchKnowledgeBase } = require("./ragTool");
const { executeCurrencyTool } = require("./currencyTool");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

function isGreeting(text) {
  return /^(hi|hello|hey|good morning|good evening)\b/i.test(
    text.trim().toLowerCase()
  );
}

async function runAgent(messages) {

  const latestMessage =
    messages[messages.length - 1]?.content || "";

  // ✅ Allow greetings only
  if (isGreeting(latestMessage)) {
    return "Hello! How can I help you today?";
  }

  // 1. Ask OpenAI to choose ONLY tools
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools: TOOLS,
    tool_choice: "required",
  });

  const message = response.choices[0].message;

  // ❌ No tool used = BLOCK
  if (!message.tool_calls?.length) {
    return "I could not find this information in the uploaded documents.";
  }

  const toolResults = [];

  // 2. Execute tools
  for (const toolCall of message.tool_calls) {

    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    let result;

    // ---------- Pinecone RAG ----------
    if (name === "search_knowledge_base") {

      result = await searchKnowledgeBase(args.query);

      if (!result) {
        return "I could not find this information in the uploaded documents.";
      }
    }

    // ---------- Currency API ----------
    else {

      result = await executeCurrencyTool(name, args);

      if (!result) {
        return "Unable to retrieve currency data.";
      }
    }

    toolResults.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content:
        typeof result === "string"
          ? result
          : JSON.stringify(result),
    });
  }

  // 3. Final AI answer ONLY from tool results
  const finalResponse =
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...messages,
        message,
        ...toolResults,
      ],
    });

  return finalResponse.choices[0].message.content;
}

module.exports = { runAgent, openai };