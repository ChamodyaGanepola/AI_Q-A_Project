const { openai } = require("./openaiClient");
const { searchKnowledgeBase } = require("./ragService");

async function runRagAgent(query, messages) {

  const context = messages.slice(-10)
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  // 1. REASONING STEP
  const plan = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are a reasoning agent for document search.

Decide:
- what user really wants
- what to search in knowledge base

Return only a refined query.
        `
      },
      {
        role: "user",
        content: `USER: ${query}\nCONTEXT:\n${context}`
      }
    ]
  });

  const refinedQuery = plan.choices[0].message.content;

  // 2. TOOL USE
  const docs = await searchKnowledgeBase(refinedQuery);

  // 3. REFLECTION STEP
  const final = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are a document QA reasoning agent.

Rules:
- Use ONLY documents
- If missing info, say so
- Be precise
        `
      },
      {
        role: "user",
        content: `
QUESTION: ${query}

REASONED QUERY: ${refinedQuery}

DOCUMENTS:
${docs || "NO DATA"}
        `
      }
    ]
  });

  return final.choices[0].message.content;
}

module.exports = { runRagAgent };