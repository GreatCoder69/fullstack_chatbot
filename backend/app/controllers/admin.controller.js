const User = require("../models/user.model");

exports.toggleUserStatus = async (req, res) => {
  const { email, isActive } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ message: "User not found." });

  user.isActive = isActive;
  await user.save();

  res.send({ message: `User ${isActive ? "enabled" : "disabled"}.` });
};
