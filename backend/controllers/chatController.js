const { searchDocs } = require("../services/ragService");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chat = async (req, res) => {
  const { message } = req.body;

  const matches = await searchDocs(message);

  const context = matches
    .map(m => m.metadata.text)
    .join("\n");

  const answer = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Answer only using context below",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${message}`,
      },
    ],
  });

  res.json({ reply: answer.choices[0].message.content });
};

module.exports = { chat };