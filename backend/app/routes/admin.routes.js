const { verifyToken } = require("../middlewares/authJwt");
const isAdmin = require("../middlewares/isAdmin");
const controller = require("../controllers/admin.controller");

module.exports = (app) => {
  app.get(
    "/api/admin/users-chats",
    [verifyToken, isAdmin],
    controller.getUsersWithChats
  );

  app.post(
    "/api/admin/toggle-status",
    [verifyToken, isAdmin],
    controller.toggleUserStatus
  );
};
