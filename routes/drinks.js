const express = require("express");
const router = express.Router();
const {
  createDrink,
  getAllDrinks,
  getDrink,
  updateDrink,
  deleteDrink,
} = require("../controllers/drinks");

router.route("/").get(getAllDrinks).post(createDrink);
router.route("/:id").get(getDrink).patch(updateDrink).delete(deleteDrink);

module.exports = router;
