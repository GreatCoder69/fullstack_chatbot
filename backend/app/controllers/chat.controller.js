const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Chat = require("../models/chat.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyAlUit1rJO9Hz6Kl84P1iwVbaK51ipzfMI");

// Load multimodal model
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-preview-05-20" });


exports.addChat = async (req, res) => {
  const { subject, question } = req.body;
  const email = req.userEmail;

  console.log("Chat route hit, has file?", !!req.file, "has question?", !!question);

  if (!subject || (!question && !req.file) || !email) {
    return res.status(400).send({ message: "Missing subject, question/image, or email" });
  }

  try {
    let answer = null;
    let imageUrl = null;

    if (req.file) {
      // Validate image MIME type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).send({ message: "Unsupported file type" });
      }

      // File already saved by multer.diskStorage, use its path
      const filePath = req.file.path;
      imageUrl = `/uploads/${req.file.filename}`;

      // Read image from disk for Gemini input
      const imageBuffer = req.file.buffer;
      const base64Image = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype;

      const parts = [{ inlineData: { data: base64Image, mimeType } }];
      if (question) {
        parts.push({ text: question });
      }

      const result = await model.generateContent({
        contents: [{ role: "user", parts }]
      });

      answer = result.response.text();
    } else {
      // Text-only case
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: question }] }]
      });

      answer = result.response.text();
    }

    // Save to MongoDB
    const chatEntry = {
      question: question || null,
      image: imageUrl || null,
      answer,
      timestamp: new Date()
    };

    await Chat.findOneAndUpdate(
      { _id: subject, email },
      {
        $push: { chat: chatEntry },
        $set: { lastUpdated: new Date(), email }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ answer, image: imageUrl });
  } catch (err) {
    console.error("Gemini direct API error:", err);
    res.status(500).send({ message: "Failed to generate response from Gemini" });
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
