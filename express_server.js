var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {longURL: "http://www.google.com"}
};

function generateRandomString(length) {
  let randomString = "";
  const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    randomString += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return randomString;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  if (username) {
    res.cookie("username", username);
    res.redirect("/urls");
  } else {
    res.status(400).send("Enter a username to log in.")
  }
});

app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"],
                       urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] }
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
  let templateVars = { username: req.cookies["username"],
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


















