const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.config");

router.post("/uploadimg", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.status(200).json({
    message: "Image uploaded successfully",
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

module.exports = router;
