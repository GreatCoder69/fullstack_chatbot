const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  _id: String, // subject
  email: { type: String, required: true },
  chat: [
    {
      question: String,
      answer: String,
      timestamp: { type: Date, default: Date.now },
      imageUrl: String, // 👈 Added to store uploaded image path
      downloadCount: {
      type: Number,
      default: 0
    }
    }
  ],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);
