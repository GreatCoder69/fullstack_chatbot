const User = require("../models/user.model");

exports.toggleUserStatus = async (req, res) => {
  const { email, isActive } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ message: "User not found." });

  user.isActive = isActive;
  await user.save();

  res.send({ message: `User ${isActive ? "enabled" : "disabled"}.` });
};

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
