const {
  convertCurrency,
  buildCurrencyReply,
} = require("../services/currencyService");

const getCurrencyData = async (req, res) => {
  try {
    const { message, from, to, amount } = req.body;

    if (message) {
      const reply = await buildCurrencyReply(message);
      return res.json({ success: true, reply });
    }

    if (!from || !to) {
      return res.status(400).json({ success: false, error: "Missing required fields: from, to, or message." });
    }

    const conversionAmount = amount ? parseFloat(amount) : 1;
    const result = await convertCurrency(from.toUpperCase(), to.toUpperCase(), conversionAmount);

    if (result.success === false) {
      return res.status(502).json({ success: false, error: result.error?.info || "Currency API returned an error." });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Currency controller error:", error.message || error);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch currency data." });
  }
};

module.exports = { getCurrencyData };
