const express = require("express");
const router = express.Router();
const {
  createFood,
  getAllFoods,
  getFood,
  updateFood,
  deleteFood,
} = require("../controllers/foods");

router.route("/").get(getAllFoods).post(createFood);
router.route("/:id").get(getFood).patch(updateFood).delete(deleteFood);

module.exports = router;
