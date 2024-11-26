// users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const router = express.Router();
const USER_FILE = "./users.json";
const secret_key = "qwertyuiopasdfghjklzxcvbnm";

const readFile = () => {
  if (!fs.existsSync(USER_FILE)) {
    fs.writeFileSync(USER_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));
};

const writeFile = (data) => {
  fs.writeFileSync(USER_FILE, JSON.stringify(data, null, 2));
};

function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(400).json({ msg: "Token Required..." });
  }
  try {
    req.user = jwt.verify(token, secret_key);
    next();
  } catch (error) {
    return res.status(400).json({ msg: "Invalid Token..." });
  }
}

router.post("/registerUser", (req, res) => {
  if (!req.body.name || !req.body.email || !req.body.password) {
    return res.status(400).send("All the fields are required");
  }
  const users_data = readFile();
  const userExists = users_data.some((user) => user.email === req.body.email);
  if (userExists) {
    return res
      .status(400)
      .json({
        msg: "This email address already exists. Please enter a unique email address",
      });
  }

  const user_id = users_data.length
    ? users_data[users_data.length - 1].id + 1
    : 1;
  const hashedPassword = bcrypt.hashSync(req.body.password, 8);
  const newUser = {
    id: user_id,
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  };
  users_data.push(newUser);
  writeFile(users_data);
  res.status(201).json({ msg: "User Registered" });
});

router.post("/login", (req, res) => {
  const users_data = readFile();
  const user = users_data.find((user) => user.email === req.body.email);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    const token = jwt.sign({ user_id: user.id }, secret_key);
    res.status(200).json({ msg: "Login Successful...", token: token });
  } else {
    res.status(400).json({ msg: "Invalid Email or Password" });
  }
});

module.exports = router;