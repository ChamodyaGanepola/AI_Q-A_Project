const axios = require("axios");

const BASE_URL =
  process.env.CURRENCYLAYER_BASE_URL || "https://api.currencylayer.com";

const ACCESS_KEY = process.env.CURRENCYLAYER_ACCESS_KEY;

// -------------------- CORE API --------------------
async function callCurrencyLayer(endpoint, params = {}) {
  if (!ACCESS_KEY) {
    throw new Error("Currency API key missing");
  }

  try {
    const response = await axios.get(`${BASE_URL}/${endpoint}`, {
      params: {
        access_key: ACCESS_KEY,
        ...params,
      },
    });

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.response?.status || 500,
        info:
          error.response?.data?.error?.info ||
          error.message ||
          "Currency error",
      },
    };
  }
}

// -------------------- FUNCTIONS --------------------
async function getLiveRates() {
  return callCurrencyLayer("live");
}

async function getHistoricalRates(date) {
  return callCurrencyLayer("historical", { date });
}

async function convertCurrency(from, to, amount = 1) {
  const result = await callCurrencyLayer("convert", {
    from,
    to,
    amount,
  });

  if (result.success === false) {
    return result;
  }

  return {
    success: true,
    result: result.result,
    date:
      result.date ||
      new Date(
        result.info?.timestamp * 1000
      ).toISOString().split("T")[0],
    timestamp: result.info?.timestamp || null,
    query: result.query || null,
  };
}

async function getTimeframeRates(start_date, end_date) {
  return callCurrencyLayer("timeframe", {
    start_date,
    end_date,
  });
}

async function getChangeRates(currencies) {
  return callCurrencyLayer("change", currencies ? { currencies } : {});
}
async function convertHistoricalCurrency(
  from,
  to,
  amount = 1,
  date
) {
  const result = await callCurrencyLayer(
    "historical",
    { date }
  );

  if (result.success === false) {
    return result;
  }

  // CurrencyLayer historical uses USD base
  const quotes = result.quotes || {};

  let rate;

  if (from === "USD") {
    rate = quotes[`USD${to}`];
  } else {
    const fromRate = quotes[`USD${from}`];
    const toRate = quotes[`USD${to}`];

    if (fromRate && toRate) {
      rate = toRate / fromRate;
    }
  }

  if (!rate) {
    return {
      success: false,
      error: {
        info: "Historical rate unavailable",
      },
    };
  }

  return {
    success: true,
    result: amount * rate,
    rate,
    date: result.date,
  };
}

module.exports = {
  getLiveRates,
  getHistoricalRates,
  convertCurrency,
  getTimeframeRates,
  getChangeRates,
  convertHistoricalCurrency,
};