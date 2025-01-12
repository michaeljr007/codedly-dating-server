// const https = require("https");
const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { admin, db } = require("./firebaseAdmin");
const connectDB = require("./db/connect");

const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors({ origin: "http://codedlydating.com" }));

// Dummy API homepage
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Codedly Dating" });
});

// Routers
const uploadRouter = require("./routes/uploads");

// Routes
app.use("/api/video", uploadRouter);

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

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("Connected to DB");

    app.listen(PORT, () => console.log(`Server listening ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

start();
