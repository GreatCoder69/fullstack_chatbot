const fs = require('fs');
const path = require('path');
const Chat = require("../models/chat.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/user.model");
const pdfParse = require('pdf-parse');
const logEvent = require("../utils/logEvent");

exports.getAllUsersWithChats = async (req, res) => {
  try {
    const chats = await Chat.find({}).sort({ lastUpdated: -1 });
    const userIds = chats.map(c => c.email);
    const uniqueEmails = [...new Set(userIds)];

    const usersWithChats = await User.find({ email: { $in: uniqueEmails } });

    const result = await Promise.all(usersWithChats.map(async user => {
      const userChats = chats.filter(chat => chat.email === user.email);
      return {
        name: user.name,
        email: user.email,
        profileimg: user.profileimg,
        isActive: user.isActive,
        chats: userChats.map(c => ({
          subject: c._id,
          history: c.chat
        }))
      };
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Admin chat fetch error:", err);
    res.status(500).json({ message: "Error fetching user chats" });
  }
};

// Initialize Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyAlUit1rJO9Hz6Kl84P1iwVbaK51ipzfMI");
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-preview-05-20" });

exports.addChat = async (req, res) => {
  const { subject, question } = req.body;
  const email = req.userEmail;

  console.log("Chat route hit, has file?", !!req.file, "has question?", !!question);

  if (!subject || (!question && !req.file) || !email) {
    return res.status(400).send({ message: "Missing subject, question/image/pdf, or email" });
  }

  try {
    let answer = null;
    let imageUrl = null;

    if (req.file) {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
      ];

      const mimeType = req.file.mimetype;
      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).send({ message: "Unsupported file type" });
      }

      const filePath = req.file.path;
      imageUrl = `/uploads/${req.file.filename}`;

      if (mimeType === 'application/pdf') {
        // ✅ Extract text from PDF
        const pdfBuffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(pdfBuffer);
        const pdfText = parsed.text;

        const prompt = question
          ? `${question}\n\nAlso, consider this PDF content:\n${pdfText}`
          : `Please analyze this PDF content:\n${pdfText}`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        answer = result.response.text();
      } else {
        // ✅ Handle image file
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString("base64");

        const parts = [{ inlineData: { data: base64Image, mimeType } }];
        if (question) {
          parts.push({ text: question });
        }

        const result = await model.generateContent({
          contents: [{ role: "user", parts }]
        });

        answer = result.response.text();
      }
    } else {
      // ✅ Text-only input
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: question }] }]
      });

      answer = result.response.text();
    }

    const chatEntry = {
      question: question || null,
      imageUrl: imageUrl || null,
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
    await logEvent({
      email,
      action: "create_chat",
      message: `Chat message added to subject '${subject}'`,
      meta: {
        subject,
        question: question || null,
        file: imageUrl || null
      }
    });

    res.status(200).json({ answer, file: imageUrl });
  } catch (err) {
    console.error("Gemini PDF/Image/Text error:", err);
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

    // ✅ Log the chat deletion
    await logEvent({
      email,
      action: "chat_delete",
      message: `Chat '${subject}' deleted by user`,
      meta: { subject }
    });

    res.status(200).send({ message: `Chat '${subject}' deleted successfully.` });
  } catch (err) {
    console.error("Error in deleteChatBySubject:", err);
    res.status(500).send({ message: "Server error while deleting chat" });
  }
};
