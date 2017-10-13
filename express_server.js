var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {longURL: "http://www.google.com"}
};

const users = {
  "user1": {
    id: "user1",
    email: "user1@example.com",
    password: "password1"
  },
  "user2": {
    id: "user2",
    email: "user2@example.com",
    password: "password2"
  }
}

function generateRandomString(length) {
  let randomString = "";
  const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    randomString += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return randomString;
}

function findUserByEmail(email) {
  for (let userId in users) {
    let user = users[userId];
    if(user.email === email) {
      return user;
    }
  }
};

function getUser(cookieID) {
  return users[cookieID];
};

app.post("/login", (req, res) => {
  let user_id = req.body.username;
  if (username) {
    res.cookie("user_id", user_id);
    res.redirect("/urls");
  } else {
    res.status(400).send("Enter a username to log in.")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Please enter an email and a password.");
  } else if (findUserByEmail(email)) {
    res.status(400).send("Email has already been used.")
  } else {
    let userID = generateRandomString(4);
    users[userID] = { id: userID,
                      email: email,
                      password: password };
    res.cookie("user_id", users[userID]);
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  let templateVars = { user: getUser(req.cookies["user_id"]),
                       urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: getUser(req.cookies["user_id"]) }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.body.longURL) {
    res.status(400).send("Please input a URL.")
  } else {
    let shortURL = generateRandomString(6);
    urlDatabase[shortURL] = { longURL: req.body.longURL }
    res.redirect("/urls/" + shortURL);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL
  if (req.params.shortURL in urlDatabase) {
    res.redirect(longURL);
  } else {
    res.status(302).send("Shortened URL does not exist.");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { user: getUser(req.cookies["user_id"]),
                       shortURL: req.params.id,
                       urls: urlDatabase };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  if (!req.body.longURL) {
    res.status(400).send("Please input a new URL.")
  } else {
    urlDatabase[req.params.id] = { longURL: req.body.longURL }
    res.redirect("/urls/" + req.params.id);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


















