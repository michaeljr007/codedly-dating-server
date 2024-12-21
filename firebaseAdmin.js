const admin = require("firebase-admin");
const serviceAccount = require("./config/codedly-dating-firebase-adminsdk-odabq-e5bd726c15.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
