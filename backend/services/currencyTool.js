const {
  convertCurrency,
  getLiveRates,
  getHistoricalRates,
  getTimeframeRates,
  getChangeRates,
} = require("./currencyService");

async function executeCurrencyTool(name, args) {
  switch (name) {
    case "convert_currency":
      return await convertCurrency(
        args.from,
        args.to,
        args.amount || 1
      );

    case "get_live_rates":
      return await getLiveRates();

    case "get_historical_rates":
      return await getHistoricalRates(args.date);

    case "get_timeframe_rates":
      return await getTimeframeRates(
        args.start_date,
        args.end_date
      );

    case "get_change_rates":
      return await getChangeRates(args.currencies);

    default:
      throw new Error("Unknown currency tool");
  }
}

module.exports = { executeCurrencyTool };