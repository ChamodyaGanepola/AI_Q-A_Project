require("dotenv").config();

const OpenAI = require("openai");
const {
  getLiveRates,
  getHistoricalRates,
  getTimeframeRates,
  getChangeRates,
  convertCurrency,
} = require("./currencyService");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

// --- Currency tools definition for OpenAI Function Calling ---
const CURRENCY_TOOLS = [
  {
    type: "function",
    function: {
      name: "convert_currency",
      description: "Convert an amount from one currency to another using live rates.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Source currency code e.g. USD" },
          to: { type: "string", description: "Target currency code e.g. EUR" },
          amount: { type: "number", description: "Amount to convert. Default 1." },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_live_rates",
      description: "Get the latest live exchange rates.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_historical_rates",
      description: "Get exchange rates for a specific past date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format." },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_timeframe_rates",
      description: "Get exchange rates over a date range.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date in YYYY-MM-DD format." },
          end_date: { type: "string", description: "End date in YYYY-MM-DD format." },
        },
        required: ["start_date", "end_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_change_rates",
      description: "Get currency change/margin/percentage data.",
      parameters: {
        type: "object",
        properties: {
          currencies: { type: "string", description: "Comma-separated currency codes e.g. USD,EUR,GBP" },
        },
        required: [],
      },
    },
  },
];

// --- Execute whichever function GPT chose ---
async function executeCurrencyTool(name, args) {
  switch (name) {
    case "convert_currency":
      return convertCurrency(args.from, args.to, args.amount || 1);
    case "get_live_rates":
      return getLiveRates();
    case "get_historical_rates":
      return getHistoricalRates(args.date);
    case "get_timeframe_rates":
      return getTimeframeRates(args.start_date, args.end_date);
    case "get_change_rates":
      return getChangeRates(args.currencies);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Send message to GPT with currency tools available.
 * GPT will call a tool if it thinks it's needed, otherwise answers directly.
 * Returns { reply, usedTool }
 */
async function getAIResponseWithTools(messages) {
  // First call — GPT decides if a tool is needed
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools: CURRENCY_TOOLS,
    tool_choice: "auto",
  });

  const choice = response.choices[0];

  // If GPT didn't call a tool, return the direct answer
  if (choice.finish_reason !== "tool_calls") {
    return { reply: choice.message.content, usedTool: false };
  }

  // GPT called a tool — execute it
  const toolCall = choice.message.tool_calls[0];
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments);

  console.log(`GPT called tool: ${toolName}`, toolArgs);

  let toolResult;
  try {
    toolResult = await executeCurrencyTool(toolName, toolArgs);
  } catch (err) {
    toolResult = { error: err.message };
  }

  // Second call — GPT sees the tool result and generates a natural answer
  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      ...messages,
      choice.message, // assistant message with tool_calls
      {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      },
    ],
  });

  return {
    reply: finalResponse.choices[0].message.content,
    usedTool: true,
    toolName,
  };
}

const getAIResponse = async (message) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }],
  });
  return response.choices[0].message.content;
};

module.exports = { openai, getAIResponse, getAIResponseWithTools };