const TOOLS = [
  // ---------- RAG ----------
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search uploaded documents.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },

  // ---------- Currency ----------
  {
    type: "function",
    function: {
      name: "convert_currency",
      description:
        "Convert one currency to another using live exchange rates.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          amount: { type: "number" },
        },
        required: ["from", "to"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_historical_rates",
      description:
        "Get historical exchange rates for a specific date.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "YYYY-MM-DD",
          },
        },
        required: ["date"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_live_rates",
      description:
        "Get latest live currency exchange rates.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

module.exports = { TOOLS };