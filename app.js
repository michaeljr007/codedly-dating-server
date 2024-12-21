const express = require("express");
const { admin, db } = require("./firebaseAdmin");
const axios = require("axios");
require("dotenv").config();

const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Dummy API homepage
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Codedly Dating" });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
