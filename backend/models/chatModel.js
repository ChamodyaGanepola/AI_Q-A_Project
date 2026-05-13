const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
    enum: ["documents", "general"],
    default: "general",
  },
  documentsUsed: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);