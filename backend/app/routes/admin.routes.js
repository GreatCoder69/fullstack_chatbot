const { verifyToken } = require("../middlewares/authJwt");
const isAdmin = require("../middlewares/isAdmin");
const controller = require("../controllers/admin.controller");
const multer = require("multer");
const path = require("path");
const { Document, Packer, Paragraph, TextRun } = require('docx');
const Chat = require("../models/chat.model");
// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads")); // ✅ Absolute path to app/uploads // ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = (app) => {
  app.get("/api/download-docx/:entryId", async (req, res) => {
    const { entryId } = req.params;

    try {
      // ✅ Find the chat where one of the inner chat[] has this entryId
      const chat = await Chat.findOne({ "chat._id": entryId });

      if (!chat) return res.status(404).send("Chat not found");

      const entry = chat.chat.id(entryId); // ✅ match from 'chat' array
      if (!entry) return res.status(404).send("Entry not found");

      if (!entry.imageUrl || !entry.imageUrl.toLowerCase().endsWith(".pdf")) {
        return res.status(400).send("Only PDF entries are allowed for download");
      }

      // ✅ Increment download count
      entry.downloadCount = (entry.downloadCount || 0) + 1;
      await chat.save();

      // ✅ Create DOCX content
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Q: " + (entry.question || "N/A"),
                    bold: true,
                  }),
                ],
              }),
              new Paragraph(""),
              new Paragraph({
                children: [new TextRun("A: " + (entry.answer || "N/A"))],
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const filename = `response-${entryId}.docx`;

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename}`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.send(buffer);
    } catch (err) {
      console.error("Download error:", err);
      res.status(500).send("Server error");
    }
  });

  app.get(
    "/api/admin/users-chats",
    [verifyToken, isAdmin],
    controller.getAllUsersWithChats
  );

  app.post(
    "/api/admin/toggle-status",
    [verifyToken, isAdmin],
    controller.toggleUserStatus
  );

  // 👇 View any user's profile by email
  app.get(
    "/api/admin/user",
    verifyToken,
    controller.getUserByEmail
  );

  app.get(
    "/api/admin/summary",
    [verifyToken, isAdmin],
    controller.getAdminSummary
  );

  // 👇 Admin update any user's profile (with optional image)
  app.put(
    "/api/admin/user", upload.single("profileimg"),
    verifyToken, 
    controller.adminUpdateUser
  );
};
