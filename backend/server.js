require('dotenv').config(); // Load environment variables

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Enable CORS
app.use(cors());

// Parse requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

// MongoDB connection
const db = require("./app/models");
const dbConfig = require("./app/db.config.js");

db.mongoose
  .connect(`mongodb://0.0.0.0:27017/bezkoder_db`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// Import routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require("./app/routes/chat.routes")(app);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
