const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, "Please provide first name"],
    maxlength: [70, "Name too long"],
  },
  lastname: {
    type: String,
    required: [true, "Please provide last name"],
    maxlength: [70, "Name too long"],
  },
  phone: {
    type: String,
    required: [true, "Please provide phone number"],
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: [8, "Password must be up to 8 characters"],
    maxlength: [60, "Password too long"],
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  image: {
    type: String,
    default: "https://via.placeholder.com/300",
  },
  suspended: {
    type: Boolean,
    default: false,
  },
});

UserSchema.pre("save", async function () {
  let salt = await bcrypt.genSalt();

  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePasswords = function (loggedPassword) {
  let isMatch = bcrypt.compare(loggedPassword, this.password);

  return isMatch;
};

UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { userId: this._id, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
