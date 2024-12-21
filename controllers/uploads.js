const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { StatusCodes } = require("http-status-codes");

// Configuration
cloudinary.config({
  cloud_name: "ded2uopl7",
  api_key: "574272625338255",
  api_secret: "5ryhYbkxaPeAhXA6m44HuvmAuLk",
});

const uploadImg = async (req, res) => {
  try {
    const imageUrls = [];

    // Upload secondary images
    if (req.files.images && Array.isArray(req.files.images)) {
      for (const file of req.files.images) {
        const result = await cloudinary.uploader.upload(file.path, {
          use_filename: true,
          folder: "file-upload",
          transformation: [
            {
              gravity: "auto",
              width: 600,
              height: 600,
              crop: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        });
        fs.unlinkSync(file.path);
        imageUrls.push(result.secure_url);
      }
    } else {
      console.log("No secondary images uploaded.");
    }

    res.status(StatusCodes.OK).json({
      images: imageUrls,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to upload images" });
  }
};

module.exports = {
  uploadImg,
};
