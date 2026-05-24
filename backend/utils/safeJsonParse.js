function safeJsonParse(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ JSON PARSE FAILED:", text);
      return null;
    }
  }
}

module.exports = { safeJsonParse };