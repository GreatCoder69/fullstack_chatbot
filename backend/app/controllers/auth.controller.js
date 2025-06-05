const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      // Removed roles array completely
    });

    await user.save();
    res.status(201).send({ message: "User was registered successfully!" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send({ message: err.message || "Registration failed." });
  }
};

exports.signin = async (req, res) => {
  try {
    // Find user by email (signin uses email + password)
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email  // ✅ Add email to the payload
      },
      config.secret,
      {
        algorithm: "HS256",
        allowInsecureKeySizes: true,
        expiresIn: 86400, // 24 hours
      }
    );

    res.status(200).send({
      id: user._id,
      name: user.name,
      email: user.email,
      accessToken: token,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { email, name, phone, password } = req.body;

    // Check if the token's email matches the request email
    if (req.userEmail !== email) {
      return res.status(403).send({ message: "You can only update your own profile." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Update only provided fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) {
      user.password = bcrypt.hashSync(password, 8);
    }

    await user.save();
    res.status(200).send({ message: "User updated successfully." });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send({ message: "Error updating user." });
  }
};

// in controllers/auth.controller.js
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send({ message: "User not found." });

    res.status(200).send({
      name: user.name,
      phone: user.phone,
      email: user.email
    });
  } catch (err) {
    res.status(500).send({ message: "Error retrieving profile." });
  }
};
