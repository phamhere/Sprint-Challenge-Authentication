const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { authenticate } = require("./middlewares");
const db = require("../database/dbConfig");
const jwtKey = require("../_secrets/keys").jwtKey;

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

function register(req, res) {
  // implement user registration
  const creds = req.body;
  if (creds.username && creds.password) {
    const hash = bcrypt.hashSync(creds.password, 14);
    creds.password = hash;
    db("users")
      .insert(creds)
      .then(id =>
        res.status(201).json({ message: "Registration Successful", id: id })
      )
      .catch(err =>
        res.status(500).json({ message: "Error Registering", error: err })
      );
  } else {
    res
      .status(400)
      .json({ message: "Please provide a username and password." });
  }
}

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const secret = jwtKey;
  const options = {
    expiresIn: "5m"
  };
  return jwt.sign(payload, secret, options);
}

function login(req, res) {
  // implement user login
  const creds = req.body;
  db("users")
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({ message: "Logged In!", token: token });
      } else {
        res.status(401).json({ message: "You shall not pass!" });
      }
    })
    .catch(err =>
      res.status(500).json({ message: "Error Logging In", error: err })
    );
}

function getJokes(req, res) {
  axios
    .get("https://safe-falls-22549.herokuapp.com/random_ten")
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}
