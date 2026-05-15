const axios = require("axios");

const BASE_URL =
  process.env.CURRENCYLAYER_BASE_URL ||
  "https://api.currencylayer.com";

const ACCESS_KEY = process.env.CURRENCYLAYER_ACCESS_KEY;

// --- Generic CurrencyLayer API caller ---
async function callCurrencyLayer(endpoint, params = {}) {
  if (!ACCESS_KEY) {
    throw new Error("CurrencyLayer API key is not configured.");
  }

  const url = `${BASE_URL}/${endpoint}`;

  const response = await axios.get(url, {
    params: {
      access_key: ACCESS_KEY,
      ...params,
    },
  });

  return response.data;
}

// --- Live exchange rates ---
async function getLiveRates() {
  return callCurrencyLayer("live");
}

// --- Historical rates ---
async function getHistoricalRates(date) {
  if (!date) {
    throw new Error("Date is required.");
  }

  return callCurrencyLayer("historical", { date });
}

// --- Timeframe rates ---
async function getTimeframeRates(start_date, end_date) {
  if (!start_date || !end_date) {
    throw new Error("Start date and end date are required.");
  }

  return callCurrencyLayer("timeframe", {
    start_date,
    end_date,
  });
}

// --- Currency change data ---
async function getChangeRates(currencies) {
  return callCurrencyLayer(
    "change",
    currencies ? { currencies } : {}
  );
}

// --- Currency conversion ---
async function convertCurrency(from, to, amount = 1) {
  if (!from || !to) {
    throw new Error("Both from and to currency codes are required.");
  }

  return callCurrencyLayer("convert", {
    from,
    to,
    amount,
  });
}

module.exports = {
  getLiveRates,
  getHistoricalRates,
  getTimeframeRates,
  getChangeRates,
  convertCurrency,
};



/*const axios = require("axios");

const BASE_URL = process.env.CURRENCYLAYER_BASE_URL || "https://api.currencylayer.com";
const ACCESS_KEY = process.env.CURRENCYLAYER_ACCESS_KEY;
//This is the non-RAG, live Web API path.
function normalizeCurrencyCode(code) {
  return String(code || "").trim().toUpperCase();
}

function extractCurrencyPair(message) {
  const pairPattern = /([A-Za-z]{3})\s*(?:to|-|in)\s*([A-Za-z]{3})/i;
  const match = message.match(pairPattern);
  if (!match) return null;
  return {
    from: normalizeCurrencyCode(match[1]),
    to: normalizeCurrencyCode(match[2]),
  };
}

function extractAmount(message) {
  const amountPattern = /([\d,.]+)\s*([A-Za-z]{3})\s*(?:to|in)\s*[A-Za-z]{3}/i;
  const match = message.match(amountPattern);
  if (!match) return 1;
  return parseFloat(match[1].replace(/,/g, "")) || 1;
}

function extractDate(message) {
  const datePattern = /(\d{4})[-\/](\d{2})[-\/](\d{2})/;
  const match = message.match(datePattern);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function extractTimeframe(message) {
  const timeframePattern = /(?:from|start(?:ing)? date)\s*(\d{4}-\d{2}-\d{2})\s*(?:to|until|end(?:ing)? date)\s*(\d{4}-\d{2}-\d{2})/i;
  const match = message.match(timeframePattern);
  if (!match) return null;
  return { start_date: match[1], end_date: match[2] };
}

function extractCurrenciesList(message) {
  const currenciesPattern = /(?:currencies=|currencies\s*[:]?\s*)([A-Za-z]{3}(?:[,\s]+[A-Za-z]{3})*)/i;
  const match = message.match(currenciesPattern);
  if (!match) return null;
  return match[1]
    .split(/[,\s]+/)
    .map(normalizeCurrencyCode)
    .filter(Boolean)
    .join(",");
}

function parseCurrencyQuery(message) {
  if (!message) return null;
  const normalized = message.trim();
  const lower = normalized.toLowerCase();
  const date = extractDate(normalized);

  const timeframe = extractTimeframe(normalized);
  if (timeframe || /\btimeframe\b|period\b|between\b/i.test(lower)) {
    return {
      type: "timeframe",
      ...timeframe,
    };
  }

  if (/\bhistorical\b|\bdate\b/i.test(lower) && date) {
    return {
      type: "historical",
      date,
      ...extractCurrencyPair(normalized),
    };
  }

  if (/\bchange\b|\bmargin\b|\bpercentage\b/i.test(lower)) {
    return {
      type: "change",
      currencies: extractCurrenciesList(normalized) || undefined,
    };
  }

  if (/\blive\b|\blatest\b|\bcurrent exchange rate\b|\bmost recent\b/i.test(lower)) {
    return {
      type: "live",
      ...extractCurrencyPair(normalized),
    };
  }

  const currencyPair = extractCurrencyPair(normalized);
  if (currencyPair && date && /\bconvert\b|\bexchange rate\b|\brate\b|\bhow much\b|\bwhat is\b|\bwhat's\b/i.test(lower)) {
    return {
      type: "historical_convert",
      date,
      from: currencyPair.from,
      to: currencyPair.to,
      amount: extractAmount(normalized),
    };
  }

  if (currencyPair && /\bconvert\b|\bexchange rate\b|\brate\b|\bhow much\b|\bwhat is\b|\bwhat's\b/i.test(lower)) {
    return {
      type: "convert",
      from: currencyPair.from,
      to: currencyPair.to,
      amount: extractAmount(normalized),
    };
  }

  // fallback convert query for simple requests like "USD to EUR"
  if (currencyPair) {
    return {
      type: "convert",
      from: currencyPair.from,
      to: currencyPair.to,
      amount: 1,
    };
  }

  return null;
}
//Keyword-based pre-check before calling the classifier
function isCurrencyQuestion(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  const currencyKeywords = [
    "convert",
    "exchange rate",
    "rate",
    "currency",
    "live",
    "latest",
    "historical",
    "timeframe",
    "change",
    "usd",
    "eur",
    "gbp",
    "aud",
    "cad",
    "jpy",
    "inr",
    "btc",
  ];

  const hasKeyword = currencyKeywords.some((keyword) => lower.includes(keyword));
  const hasCode = /[A-Za-z]{3}/.test(message);
  return hasKeyword && hasCode;
}

async function callCurrencyLayer(endpoint, params = {}) {
  if (!ACCESS_KEY) {
    throw new Error("CurrencyLayer API key is not configured.");
  }

  const url = `${BASE_URL}/${endpoint}`;
  const response = await axios.get(url, {
    params: {
      access_key: ACCESS_KEY,
      ...params,
    },
  });
  return response.data;
}

async function getLiveRates() {
  return callCurrencyLayer("live");
}

async function getHistoricalRates(date) {
  if (!date) throw new Error("A date is required for historical rate requests.");
  return callCurrencyLayer("historical", { date });
}

async function getTimeframeRates(start_date, end_date) {
  if (!start_date || !end_date) {
    throw new Error("Start date and end date are required for timeframe requests.");
  }
  return callCurrencyLayer("timeframe", { start_date, end_date });
}

async function getChangeRates(currencies) {
  return callCurrencyLayer("change", currencies ? { currencies } : {});
}

async function convertCurrency(from, to, amount = 1) {
  if (!from || !to) {
    throw new Error("Both from and to currency codes are required for conversion.");
  }
  return callCurrencyLayer("convert", { from, to, amount });
}

function computePairQuote(quotes, from, to) {
  if (!quotes) return null;
  if (from === to) return 1;
  const usdFrom = quotes[`USD${from}`];
  const usdTo = quotes[`USD${to}`];

  if (from === "USD") return usdTo;
  if (to === "USD") return usdFrom ? 1 / usdFrom : null;
  if (usdFrom && usdTo) return usdTo / usdFrom;
  return null;
}

function formatNumber(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

async function buildCurrencyReply(message) {
  const query = parseCurrencyQuery(message);
  if (!query) {
    return "I detected a currency question, but I couldn't parse the request. Please ask something like 'Convert 10 USD to EUR', 'What is the live USD to GBP rate?', 'Get historical rates for 2024-01-01', or 'Show change for USD,EUR'.";
  }

  try {
    switch (query.type) {
      case "live": {
        const result = await getLiveRates();
        if (result.success === false) {
          return `Currency API error: ${result.error?.info || "Unable to fetch live rates."}`;
        }

        if (query.from && query.to) {
          const pairValue = computePairQuote(result.quotes, query.from, query.to);
          if (pairValue == null) {
            return `Live rates are available, but I couldn't compute the rate for ${query.from} to ${query.to}.`; 
          }
          return `Live exchange rate: 1 ${query.from} = ${formatNumber(pairValue)} ${query.to} (source: ${result.source}, timestamp: ${new Date(result.timestamp * 1000).toISOString()}).`;
        }

        return `Live rates retrieved successfully. Base currency: ${result.source}. Available quote count: ${Object.keys(result.quotes || {}).length}.`; 
      }
      case "historical": {
        if (!query.date) {
          return "Please provide a date in YYYY-MM-DD format for historical rates.";
        }
        const result = await getHistoricalRates(query.date);
        if (result.success === false) {
          return `Currency API error: ${result.error?.info || "Unable to fetch historical rates."}`;
        }

        if (query.from && query.to) {
          if (query.from !== "USD") {
            return `Historical rate queries currently return USD-based quotes only. For ${query.from} to ${query.to}, please ask using USD as the base currency or use a conversion query.`;
          }
          const quoteKey = `USD${query.to}`;
          const rate = result.quotes?.[quoteKey];
          if (!rate) {
            return `Historical rates retrieved, but ${quoteKey} is not available for ${query.date}.`;
          }
          return `Historical rate on ${query.date}: 1 USD = ${formatNumber(rate)} ${query.to} (source: ${result.source}).`;
        }

        return `Historical USD rates for ${query.date} retrieved. Available quotes: ${Object.keys(result.quotes || {}).length}.`;
      }
      case "historical_convert": {
        if (!query.date) {
          return "Please provide a date in YYYY-MM-DD format for historical conversions.";
        }

        const result = await getHistoricalRates(query.date);
        if (result.success === false) {
          return `Currency API error: ${result.error?.info || "Unable to fetch historical rates."}`;
        }

        const pairValue = computePairQuote(result.quotes, query.from, query.to);
        if (pairValue == null) {
          return `Historical rates are available for ${query.date}, but I couldn't compute the rate for ${query.from} to ${query.to}.`;
        }

        return `Historical conversion result on ${query.date}: ${query.amount || 1} ${query.from} = ${formatNumber((query.amount || 1) * pairValue)} ${query.to}. Rate: 1 ${query.from} = ${formatNumber(pairValue)} ${query.to} (source: ${result.source}).`;
      }
      case "timeframe": {
        if (!query.start_date || !query.end_date) {
          return "Please provide both a start date and end date in YYYY-MM-DD format for timeframe requests.";
        }
        const result = await getTimeframeRates(query.start_date, query.end_date);
        if (result.success === false) {
          return `Currency API error: ${result.error?.info || "Unable to fetch timeframe rates."}`;
        }
        return `Timeframe rates retrieved from ${query.start_date} to ${query.end_date}. ${Object.keys(result.quotes || {}).length} date entries available.`;
      }
      case "change": {
        const result = await getChangeRates(query.currencies);
        if (result.success === false) {
          return `Currency API error: ${result.error?.info || "Unable to fetch change data."}`;
        }
        return `Currency change data retrieved for ${query.currencies || "all available currencies"}.`; 
      }
      case "convert": {
        const result = await convertCurrency(query.from, query.to, query.amount || 1);
        if (result.success === false) {
          return `Currency API error: ${result.error?.info || "Unable to fetch conversion."}`;
        }
        return `Currency conversion result: ${query.amount || 1} ${query.from} = ${formatNumber(result.result)} ${query.to}. (source: ${result.query?.source || "currencylayer"}, timestamp: ${new Date(result.info.timestamp * 1000).toISOString()}).`;
      }
      default:
        return "I detected a currency question but couldn't match it to a supported endpoint.";
    }
  } catch (error) {
    console.error("Currency service error:", error.message || error);
    throw error;
  }
}

module.exports = {
  isCurrencyQuestion,
  buildCurrencyReply,
  getLiveRates,
  getHistoricalRates,
  getTimeframeRates,
  getChangeRates,
  convertCurrency,
  parseCurrencyQuery,
};
*/
