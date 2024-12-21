const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");

const { check, validationResult } = require("express-validator");

// Sign up function
const signup = [
  // Validation rules
  check("firstname").notEmpty().withMessage("Firstname is required"),
  check("lastname").notEmpty().withMessage("Lastname is required"),
  check("phone").notEmpty().withMessage("Phone is required"),
  check("email")
    .isEmail()
    .withMessage("Email is not valid")
    .notEmpty()
    .withMessage("Please input email"),
  check("gender").notEmpty().withMessage("Gender is required"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { firstname, lastname, phone, email, password, gender, role } =
      req.body;

    if (role && role === "admin") {
      role = "admin";
    } else {
      role = "customer";
    }

    // Create the new user
    const newUser = await User.create({
      firstname,
      lastname,
      phone,
      email,
      password,
      gender,
      role,
    });

    const token = newUser.generateToken();

    res
      .status(StatusCodes.CREATED)
      .json({ msg: "User Created", newUser, token: token });
  },
];

// Login function
const login = [
  // Validation rules
  check("userEmail")
    .notEmpty()
    .withMessage("Please input email")
    .isEmail()
    .withMessage("Please enter a valid email"),
  check("userPassword").notEmpty().withMessage("Please input password"),

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { userEmail, userPassword } = req.body;

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Email does not exist" });
    }

    let isPasswordMatch = await user.comparePasswords(userPassword);

    if (isPasswordMatch === false) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Incorrect Username or Password" });
    } else {
      const token = user.generateToken();

      res.status(StatusCodes.OK).json({
        msg: "Login Success",
        user: {
          name: user.firstname,
          id: user._id,
          image: user.image,
          role: user.role,
          token: token,
          email: user.email,
        },
      });
    }
  },
];
// Get users
const getAllUsers = async (req, res) => {
  res.send("get all users");
};

// Get Single User
const getUser = async (req, res) => {
  res.send("get single user");
};

// Update user
const updateUser = async (req, res) => {
  res.send("update user");
};

// Delete user
const deleteUser = async (req, res) => {
  res.send("delete user");
};

module.exports = {
  login,
  signup,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
};
