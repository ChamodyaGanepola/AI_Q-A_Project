const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    reply: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["documents", "general", "currency", "currency_error", "no_match"],
      default: "general",
    },
    documentsUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
