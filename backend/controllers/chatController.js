const { getAIResponse } = require("../services/openaiService");

const chat = async (req, res) => {
  const { message } = req.body;

  const reply = await getAIResponse(message);

  res.json({ reply });
};

module.exports = { chat };