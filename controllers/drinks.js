const Drink = require("../models/Drink");
const { StatusCodes } = require("http-status-codes");

const getAllDrinks = async (req, res) => {
  let allDrink = await Drink.find({});

  if (!allDrink) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No drink found", success: false });
  }

  return res.status(StatusCodes.OK).json({ food: allDrink, success: true });
};

const getDrink = async (req, res) => {
  res.send("get single Food");
};

const createDrink = async (req, res) => {
  const { title, price, description, images } = req.body;

  if (!title || !price || !description || !images) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please fill all fields", success: false });
  }

  const drink = await Drink.create({
    title,

    price,

    description,

    images,
  });

  res.status(StatusCodes.CREATED).json({ drink });
};

const updateDrink = async (req, res) => {
  res.send("update Food");
};

const deleteDrink = async (req, res) => {
  const { id } = req.params;
  const drink = await Drink.find({ _id: id });

  if (!drink) {
    return res.send("No food matches id");
  }

  await Drink.deleteOne({ _id: id });

  res.status(StatusCodes.OK).json({ msg: "Item deleted", drink });
};

module.exports = {
  getAllDrinks,
  getDrink,
  createDrink,
  updateDrink,
  deleteDrink,
};
