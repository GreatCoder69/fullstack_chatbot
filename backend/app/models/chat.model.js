const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  _id: String, // subject
  email: { type: String, required: true }, // 👈 Added this line
  chat: [
    {
      question: String,
      answer: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);
