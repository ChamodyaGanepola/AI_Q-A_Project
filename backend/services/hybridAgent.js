const { openai } = require("./openaiClient");
const { searchKnowledgeBase } = require("./ragService");

const {
  convertCurrency,
  convertHistoricalCurrency,
} = require("./currencyService");

async function runHybridAgent(
  { ragQuery, currencyQuery },
  messages = []
) {

  try {

    console.log("===== HYBRID START =====");

    const context = (messages || [])
      .slice(-10)
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    console.log("CONTEXT OK");

    // ---------------- RAG ----------------
    let ragDocs = "No RAG data";

    try {

      if (ragQuery) {

        console.log("SEARCHING RAG:", ragQuery);

        ragDocs =
          await searchKnowledgeBase(ragQuery);

        console.log("RAG RESULT:", ragDocs);
      }

    } catch (err) {

      console.error("RAG ERROR:", err);

      ragDocs = "RAG unavailable";
    }

    // ---------------- CURRENCY ----------------
    let currencyResult = "No currency data";

    try {

      if (
        currencyQuery?.from &&
        currencyQuery?.to
      ) {

        console.log(
          "CURRENCY QUERY:",
          currencyQuery
        );

        const {
          from,
          to,
          amount = 1,
          date,
        } = currencyQuery;

        let result;

        if (date) {

          console.log(
            "USING HISTORICAL"
          );

          result =
            await convertHistoricalCurrency(
              from,
              to,
              amount,
              date
            );

        } else {

          console.log("USING LIVE");

          result =
            await convertCurrency(
              from,
              to,
              amount
            );
        }

        console.log(
          "CURRENCY RESULT:",
          result
        );

        if (
          result &&
          result.success !== false &&
          result.result
        ) {

          currencyResult =
            `${amount} ${from} = ${result.result} ${to}` +
            (result.date
              ? ` (Rate date: ${result.date})`
              : "");

        } else {

          currencyResult =
            result?.error?.info ||
            "Currency unavailable";
        }
      }

    } catch (err) {

      console.error(
        "CURRENCY ERROR:",
        err
      );

      currencyResult =
        "Currency unavailable";
    }

    console.log("FINAL RAG:", ragDocs);
    console.log(
      "FINAL CURRENCY:",
      currencyResult
    );

    // ---------------- OPENAI ----------------
    const res =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a hybrid AI agent.

Use:
- RAG data
- Currency data

Never hallucinate.
            `,
          },
          {
            role: "user",
            content: `
RAG:
${ragDocs}

CURRENCY:
${currencyResult}
            `,
          },
        ],
      });

    console.log("OPENAI SUCCESS");

    return {
      answer:
        res.choices[0].message.content,
    };

  } catch (err) {

    console.error(
      "HYBRID FATAL ERROR:",
      err
    );

    return {
      answer:
        "Unable to process request.",
    };
  }
}

module.exports = { runHybridAgent };