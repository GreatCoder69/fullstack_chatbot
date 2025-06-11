const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const { verifyToken } = require("../middlewares/authJwt"); // ensure JWT auth
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// Define routes on the router
router.post("/chat", verifyToken, upload.single("image"), chatController.addChat);
router.get("/chat/:subject", verifyToken, chatController.getChatBySubject);
router.get("/chat", verifyToken, chatController.getAllChats); // ✅ Add verifyToken back
router.post("/deletechat", verifyToken, chatController.deleteChatBySubject);

// Export as a function to register with app
module.exports = (app) => {
  app.use('/api', router);
};
