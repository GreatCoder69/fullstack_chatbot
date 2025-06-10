// Add or update a chat
const Chat = require("../models/chat.model");

exports.addChat = async (req, res) => {
  const { subject, question } = req.body;
  const email = req.userEmail;

  if (!subject || !question || !email) {
    return res.status(400).send({ message: "Missing subject, question, or email" });
  }

  try {
    // 🔁 Call Gemini via your Flask backend
    const geminiRes = await fetch("http://localhost:5000/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const result = await geminiRes.json();
    const answer = result.answer || "Sorry, I couldn't respond.";

    const chatEntry = { question, answer, timestamp: new Date() };

    const updatedChat = await Chat.findOneAndUpdate(
      { _id: subject, email },
      {
        $push: { chat: chatEntry },
        $set: { lastUpdated: new Date(), email }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ answer });
  } catch (err) {
    console.error("Gemini LLM error:", err);
    res.status(500).send({ message: "LLM request failed." });
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

// Delete a chat by subject
exports.deleteChatBySubject = async (req, res) => {
  const email = req.userEmail;
  const subject = req.body.subject;

  if (!subject || !email) {
    return res.status(400).send({ message: "Missing subject or email" });
  }

  try {
    const result = await Chat.deleteOne({ _id: subject, email });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Chat not found or already deleted" });
    }

    res.status(200).send({ message: `Chat '${subject}' deleted successfully.` });
  } catch (err) {
    console.error("Error in deleteChatBySubject:", err);
    res.status(500).send({ message: "Server error while deleting chat" });
  }
};
