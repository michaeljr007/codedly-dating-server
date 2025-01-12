const express = require("express");
const router = express.Router();
const { uploadVid, getVid, streamVid } = require("../controllers/uploads");

router.post("/upload", uploadVid); // Upload video
router.get("/", getVid); // Fetch all videos metadata
router.get("/stream/:filename", streamVid);

module.exports = router;
