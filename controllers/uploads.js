const { StatusCodes } = require("http-status-codes");
require("dotenv").config();
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const { GridFsStorage } = require("multer-gridfs-storage");
const multer = require("multer");
const Video = require("../models/Video");

// MongoDB connection
const mongoURI = process.env.MONGO_URI; // Update with your database URI
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initialize GridFS
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads"); // Collection name for storing files
});

// GridFS storage engine for Multer
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      bucketName: "uploads", // Same collection name as above
      filename: `${Date.now()}-${file.originalname}`,
    };
  },
});
const upload = multer({ storage });

// Upload video to GridFS
const uploadVid = async (req, res) => {
  try {
    upload.single("video")(req, res, async (err) => {
      if (err) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Video upload failed", details: err.message });
      }

      if (!req.file) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "No video file provided" });
      }

      const { gender, uploadedBy } = req.body; // Example fields from request body
      const video = new Video({
        filename: req.file.filename, // Filename in GridFS
        gender,
        uploadedBy,
      });

      await video.save();

      res.status(StatusCodes.OK).json({
        msg: "Video uploaded successfully",
        file: req.file,
        metadata: video,
      });
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Server error", details: error.message });
  }
};

// Fetch all videos metadata
const getVid = async (req, res) => {
  try {
    const videos = await Video.find(); // Fetch all metadata from the Video collection
    if (!videos || videos.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "No videos found" });
    }

    res.status(StatusCodes.OK).json({ videos });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Server error", details: error.message });
  }
};

// Stream video to the client
const streamVid = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!gfs) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "GridFS not initialized" });
    }

    gfs.files.findOne({ filename }, (err, file) => {
      if (!file || file.length === 0) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Video not found" });
      }

      if (!file.contentType.startsWith("video/")) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Not a video file" });
      }

      const readStream = gfs.createReadStream(file.filename);
      res.set("Content-Type", file.contentType);
      readStream.pipe(res);
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Server error", details: error.message });
  }
};

module.exports = {
  uploadVid,
  getVid,
  streamVid,
};
