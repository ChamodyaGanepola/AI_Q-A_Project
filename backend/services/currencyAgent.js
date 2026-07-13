const { openai } = require("./openaiClient");
const {
  convertCurrency,
  convertHistoricalCurrency,
} = require("./currencyService");

async function runCurrencyAgent({
  currencyQuery,
  messages = [],
  userMessage,
}) {
  try {
    // ---------------- SAFE HISTORY ----------------
    const history = (messages || [])
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // ---------------- VALIDATION ----------------
    if (!currencyQuery?.from || !currencyQuery?.to) {
      return {
        answer: "Missing currency data (from/to).",
      };
    }

    const {
      from,
      to,
      amount = 1,
      date,
    } = currencyQuery;

    let conversionResult;

    try {
      const apiResult = date
        ? await convertHistoricalCurrency(
          from,
          to,
          amount,
          date
        )
        : await convertCurrency(
          from,
          to,
          amount
        );
      if (!apiResult || apiResult.success === false || !apiResult.result) {
        conversionResult =
          apiResult?.error?.info ||
          "Currency service unavailable";
      } else {
        const conversionDate =
          apiResult.date || "today";

        conversionResult =
          `${amount} ${from} = ${apiResult.result} ${to} (Rate date: ${conversionDate})`;
      }
    } catch (err) {
      conversionResult = "Currency service unavailable";
    }

    // ---------------- LLM RESPONSE ----------------
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a Currency Agent.

Rules:
- Use ONLY provided conversion result
- Never hallucinate rates
- Explain clearly and simply
          `,
        },
        {
          role: "user",
          content: `
CHAT:
${history}

USER:
${userMessage}

RESULT:
${conversionResult}
          `,
        },
      ],
    });

    return {
      answer: response.choices[0].message.content,
    };
  } catch (err) {
    console.error(err);
    return {
      answer: "Currency service temporarily unavailable.",
    };
  }
}

module.exports = { runCurrencyAgent };