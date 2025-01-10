// const https = require("https");
const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { admin, db } = require("./firebaseAdmin");

const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Dummy API homepage
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Codedly Dating" });
});

// image upload
const BACKBLAZE_ID = process.env.BACKBLAZE_ID;
const BACKBLAZE_KEY = process.env.BACKBLAZE_KEY;
const BUCKET_ID = process.env.BACKBLAZE_BUCKET;

const multer = require("multer");
const upload = multer();

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file; // File from the request
    const fileName = req.body.fileName || file.originalname;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    // Step 1: Authorize with Backblaze
    const authResponse = await axios.get(
      "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
      {
        auth: {
          username: BACKBLAZE_ID,
          password: BACKBLAZE_KEY,
        },
      }
    );

    const { authorizationToken, apiUrl } = authResponse.data;

    // Step 2: Get Upload URL
    const uploadUrlResponse = await axios.post(
      `${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: BUCKET_ID },
      { headers: { Authorization: authorizationToken } }
    );

    const { uploadUrl, authorizationToken: uploadAuthToken } =
      uploadUrlResponse.data;

    // Step 3: Upload File
    const uploadResponse = await axios.post(uploadUrl, file.buffer, {
      headers: {
        Authorization: uploadAuthToken,
        "Content-Type": file.mimetype,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "X-Bz-Content-Sha1": "do_not_verify", // Backblaze requires this
      },
    });

    // Step 4: Send response with file URL
    const fileUrl = `${
      authResponse.data.downloadUrl
    }/file/${BUCKET_ID}/${encodeURIComponent(fileName)}`;
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error.response?.data || error);
    res.status(500).send("Failed to upload file.");
  }
});

app.post("/api/verify-payment", async (req, res) => {
  const { reference, userId } = req.body;

  try {
    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        port: 443,
      }
    );

    if (response.data.data.status === "success") {
      // Update Firestore user document with subscription details
      const expiresAt = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ); // 30 days from now

      await db.collection("users").doc(userId).update({
        premium: true,
        expiresAt,
      });

      res.status(200).send("Subscription updated successfully");
    } else {
      res.status(400).send("Payment verification failed");
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Webhook endpoint to handle Paystack events
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body);

    if (event.event === "charge.success" || event.event === "charge.failed") {
      const reference = event.data.reference;
      const email = event.data.metadata.email;

      try {
        const response = await axios.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
            port: 443,
          }
        );

        if (response.data.data.status === "success") {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await db.collection("users").doc(email).update({
            premium: true,
            expiresAt: expiresAt,
          });

          return res.status(200).send("Payment verified and user updated");
        } else {
          await db.collection("users").doc(email).update({
            premium: false,
          });

          return res
            .status(400)
            .send("Payment verification failed and user updated");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).send("Internal Server Error");
      }
    }

    res.sendStatus(200);
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
