require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
});

const getAIResponse = async (message) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }],
  });

  return response.choices[0].message.content;
};

// Rule-based classifier — detects currency API intent only.
// Everything else falls through to Pinecone RAG in the controller.
const classifyIntent = (message) => {
  if (!message) return { intent: "other", reason: "Empty message" };

  const lower = message.toLowerCase();

  const CURRENCY_KEYWORDS = [
    "convert", "exchange rate", "rate", "currency",
    "live", "latest", "historical", "timeframe", "change",
    "usd", "eur", "gbp", "aud", "cad", "jpy", "inr", "btc",
  ];

  const CURRENCY_PAIR_PATTERN = /[A-Za-z]{3}\s*(to|-|in)\s*[A-Za-z]{3}/i;

  const hasCurrencyKeyword = CURRENCY_KEYWORDS.some((kw) => lower.includes(kw));
  const hasCurrencyPair = CURRENCY_PAIR_PATTERN.test(message);

  if (hasCurrencyKeyword || hasCurrencyPair) {
    return { intent: "currency_api", reason: "Currency keyword or pair detected" };
  }

  return { intent: "other", reason: "No currency pattern matched" };
};

module.exports = { openai, getAIResponse, classifyIntent };