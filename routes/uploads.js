const express = require("express");
const router = express.Router();
const { uploadImg } = require("../controllers/uploads");

router.post("/", uploadImg);

module.exports = router;
