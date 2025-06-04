const Chat = require("../models/chat.model");

// Add or update a chat
exports.addChat = async (req, res) => {
  const { subject, question, answer } = req.body;
  const email = req.userEmail; // from verified token middleware

  if (!subject || !question || !answer || !email) {
    return res.status(400).send({ message: "Missing subject, question, answer, or email" });
  }

  const chatEntry = { question, answer, timestamp: new Date() };

  try {
    const updatedChat = await Chat.findOneAndUpdate(
      { _id: subject, email }, // unique pair: subject + user
      {
        $push: { chat: chatEntry },
        $set: { lastUpdated: new Date(), email }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).send(updatedChat);
  } catch (err) {
    console.error("Error in addChat:", err);
    res.status(500).send({ message: "Server error while saving chat" });
  }
};

// Get chat by subject (for a specific user)
exports.getChatBySubject = async (req, res) => {
  const email = req.userEmail;
  const subject = req.params.subject;

  if (!subject || !email) {
    return res.status(400).send({ message: "Missing subject or email" });
  }

  try {
    const chat = await Chat.findOne({ _id: subject, email });
    if (!chat) return res.status(404).send({ message: "No chat found for this subject" });
    res.status(200).send(chat);
  } catch (err) {
    console.error("Error in getChatBySubject:", err);
    res.status(500).send({ message: "Server error while fetching chat" });
  }
};

// Get all chats for a specific user
exports.getAllChats = async (req, res) => {
  const email = req.userEmail;

  try {
    const chats = await Chat.find({ email }).sort({ lastUpdated: -1 });
    res.status(200).json(chats);
  } catch (err) {
    console.error("Error in getAllChats:", err);
    res.status(500).json({ message: "Server error while fetching chats" });
  }
};