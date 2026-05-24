const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function decideAgent(messages, userMessage) {

  const context = messages.slice(-10)
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  try {

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an agent planner.

You do NOT answer.

You ONLY decide routing.

CAPABILITIES:
1. RAG (documents, banking, explanations)
2. CURRENCY (money conversion, exchange rates)
3. HYBRID (RAG + CURRENCY together)

---------------- RULES ----------------
- RAG = general knowledge, documents, explanations
- CURRENCY = ANY mention of money, currency codes (USD, EUR, LKR, $, convert, rate)
- HYBRID = if BOTH knowledge + currency exist in same query

🔥 IMPORTANT PRIORITY RULE:
- If currency intent exists → NEVER ignore it
- If currency exists + knowledge exists → MUST choose HYBRID

DEFAULT:
- If unsure → choose RAG

DATE RULE:
- If historical conversion is requested → extract date in YYYY-MM-DD format

NEVER:
- return empty fields
- return null values
- return invalid agent types

OUTPUT JSON:
{
  "agent": "RAG | CURRENCY | HYBRID",
  "ragQuery": "",
  "currencyQuery": {
    "from": "USD",
    "to": "EUR",
    "amount": 1,
    "date": ""
  },
  "reasoning": ""
}
`
        },
        {
          role: "user",
          content: `
CHAT HISTORY:
${context}

USER:
${userMessage}
          `
        }
      ]
    });

    const raw = res.choices[0].message.content;

    const parsed = JSON.parse(raw);

    // ---------------- SAFETY PATCH ----------------
    return {
      agent: parsed.agent || "RAG",
      ragQuery: parsed.ragQuery || "",
      currencyQuery: {
        from: parsed.currencyQuery?.from || "",
        to: parsed.currencyQuery?.to || "",
        amount: parsed.currencyQuery?.amount || 1,
        date: parsed.currencyQuery?.date || ""
      },
      reasoning: parsed.reasoning || ""
    };

  } catch (err) {

    console.error("decideAgent error:", err);

    // SAFE FALLBACK (NEVER BREAK SYSTEM)
    return {
      agent: "RAG",
      ragQuery: userMessage,
      currencyQuery: {
        from: "",
        to: "",
        amount: 1,
        date: ""
      },
      reasoning: "fallback due to parsing error"
    };
  }
}

module.exports = { decideAgent };