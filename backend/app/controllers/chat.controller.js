const Chat = require("../models/chat.model");

exports.addChat = async (req, res) => {
  const { subject, question, answer } = req.body;

  if (!subject || !question || !answer) {
    return res.status(400).send({ message: "Missing subject, question, or answer" });
  }

  const chatEntry = { question, answer, timestamp: new Date() };

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      subject,
      { $push: { chat: chatEntry } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).send(updatedChat);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getChatBySubject = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.subject);
    if (!chat) return res.status(404).send({ message: "No chat found for this subject" });
    res.status(200).send(chat);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};