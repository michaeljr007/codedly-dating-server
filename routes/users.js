const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/users");

router.post("/signup", signup);
router.post("/login", login);
router.route("/").get(getAllUsers);
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
