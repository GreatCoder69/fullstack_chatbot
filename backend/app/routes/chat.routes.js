const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const { verifyToken } = require("../middlewares/authJwt"); // ensure JWT auth

// Define routes on the router
router.post("/chat", verifyToken, chatController.addChat);
router.get("/chat/:subject", verifyToken, chatController.getChatBySubject);
router.get("/chat", verifyToken, chatController.getAllChats); // ✅ Add verifyToken back

// Export as a function to register with app
module.exports = (app) => {
  app.use('/api', router);
};
