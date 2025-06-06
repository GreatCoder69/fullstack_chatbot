const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: String,
    profileimg: String, // URL or path to the profile image
  })
);

module.exports = User;
