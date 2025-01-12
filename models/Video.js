const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  filename: String,
  timestamp: { type: Date, default: Date.now, expires: "24h" }, // Deletes document after 24 hours
  gender: String,
  uploadedBy: String,
});

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
