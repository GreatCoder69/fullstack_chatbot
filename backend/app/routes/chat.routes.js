const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const adminController = require("../controllers/admin.controller");
const { verifyToken } = require("../middlewares/authJwt"); // ensure JWT auth
const { diskUpload } = require("../middlewares/multer.config");

// Define routes on the router
router.post("/chat", verifyToken, diskUpload.single("image"), chatController.addChat);
router.get("/chat/:subject", verifyToken, chatController.getChatBySubject);
router.get("/chat", verifyToken, chatController.getAllChats); // ✅ Add verifyToken back
router.post("/deletechat", verifyToken, chatController.deleteChatBySubject);
router.get("/admin/users-chats", verifyToken, chatController.getAllUsersWithChats);
router.post('/admin/toggle-status', verifyToken, adminController.toggleUserStatus);

// Export as a function to register with app
module.exports = (app) => {
  app.use('/api', router);
};
