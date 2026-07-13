const { decideAgent } = require("./orchestratorAgent");
const { runRagAgent } = require("./ragAgent");
const { runCurrencyAgent } = require("./currencyAgent");
const { runHybridAgent } = require("./hybridAgent");

async function runSystem(userMessage, messages) {
  const decision = await decideAgent(messages, userMessage);

  if (process.env.NODE_ENV !== "production") {
    console.log("DECISION:", decision);
  }

  if (!decision || !decision.agent) {
    return "I can only help with RAG, currency conversions, or combined queries.";
  }

  switch (decision.agent) {
    case "RAG":
      return runRagAgent(decision.ragQuery || userMessage, messages);

    case "CURRENCY":
      return runCurrencyAgent({
        currencyQuery: decision.currencyQuery,
        messages,
        userMessage,
      });

    case "HYBRID":
      return runHybridAgent(
        {
          ragQuery: decision.ragQuery,
          currencyQuery: decision.currencyQuery,
        },
        messages
      );

    default:
      return "I can only help with document-based questions (RAG), currency conversions, or combined queries.";
  }
}

module.exports = { runSystem };
