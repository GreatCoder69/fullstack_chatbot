const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const express = require('express');
const app = express();
app.use(express.json());
const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");

module.exports = db;