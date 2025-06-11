const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure disk storage for saving files to the uploads folder
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Optional: Accept only images
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) {
    return cb(new Error("Only images are allowed"), false);
  }
  cb(null, true);
};

// Export both disk and memory uploads
const diskUpload = multer({ storage: diskStorage, fileFilter });
const memoryUpload = multer({ storage: multer.memoryStorage(), fileFilter });

module.exports = {
  diskUpload,   // For /uploadimg — saves to disk
  memoryUpload  // For /chat — image buffer in memory (for Gemini)
};
