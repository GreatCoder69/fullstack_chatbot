const { verifyToken } = require("../middlewares/authJwt");
const isAdmin = require("../middlewares/isAdmin");
const controller = require("../controllers/admin.controller");
const multer = require("multer");
const path = require("path");

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
