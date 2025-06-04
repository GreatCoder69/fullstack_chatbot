const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

router.post("/chat", chatController.addChat);
router.get("/chat/:subject", chatController.getChatBySubject);

module.exports = (app) => {
  const chatController = require("../controllers/chat.controller");

  app.post("/api/chat", chatController.addChat);
  app.get("/api/chat/:subject", chatController.getChatBySubject);
};