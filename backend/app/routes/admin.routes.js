const { verifyToken } = require("../middlewares/authJwt");
const isAdmin = require("../middlewares/isAdmin");
const controller = require("../controllers/admin.controller");
const multer = require("multer");
const path = require("path");
const { Document, Packer, Paragraph, TextRun } = require('docx');
const Chat = require("../models/chat.model");
const MarkdownIt = require("markdown-it");
const { JSDOM } = require("jsdom");

const md = new MarkdownIt();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads")); // ✅ Absolute path to app/uploads
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Markdown to Paragraph converter
function convertMarkdownToParagraphs(markdownText) {
  const html = md.render(markdownText || "N/A");
  const dom = new JSDOM(html);
  const elements = dom.window.document.body.children;

  const paragraphs = [];

  for (let el of elements) {
    if (el.tagName === "P") {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: el.textContent })],
      }));
    } else if (el.tagName === "UL") {
      for (let li of el.children) {
        paragraphs.push(new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: li.textContent })],
        }));
      }
    } else if (el.tagName === "OL") {
      for (let i = 0; i < el.children.length; i++) {
        const li = el.children[i];
        paragraphs.push(new Paragraph({
          numbering: {
            reference: "numbering-1",
            level: 0,
          },
          children: [new TextRun({ text: li.textContent })],
        }));
      }
    } else if (el.tagName === "H1" || el.tagName === "H2") {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: el.textContent, bold: true, size: 32 }),
        ],
      }));
    }
  }

  return paragraphs;
}

module.exports = (app) => {
  app.get("/api/download-docx/:entryId", async (req, res) => {
    const { entryId } = req.params;

    try {
      const chat = await Chat.findOne({ "chat._id": entryId });
      if (!chat) return res.status(404).send("Chat not found");

      const entry = chat.chat.id(entryId);
      if (!entry) return res.status(404).send("Entry not found");

      if (!entry.imageUrl || !entry.imageUrl.toLowerCase().endsWith(".pdf")) {
        return res.status(400).send("Only PDF entries are allowed for download");
      }

      entry.downloadCount = (entry.downloadCount || 0) + 1;
      await chat.save();

      // ✅ DOCX content generation with markdown formatting
      const doc = new Document({
        numbering: {
          config: [
            {
              reference: "numbering-1",
              levels: [
                {
                  level: 0,
                  format: "decimal",
                  text: "%1.",
                  alignment: "left",
                },
              ],
            },
          ],
        },
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
              ...convertMarkdownToParagraphs(entry.answer),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const filename = `response-${entryId}.docx`;

      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
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

  app.put(
    "/api/admin/user", upload.single("profileimg"),
    verifyToken,
    controller.adminUpdateUser
  );
};
