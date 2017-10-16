const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ["user_id"]
}));

const bcrypt = require('bcrypt');
const saltRounds = 10;

app.set("view engine", "ejs");

// stores urls
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca",
             userID: "user1"},
  "9sm5xK": {longURL: "http://www.google.com",
             userID: "user2"},
  "h6W0ae": {longURL: "http://www.amazon.ca",
             userID: "user1"}
};

// stores users
const users = {
  "user1": {
    id: "user1",
    email: "user1@example.com",
    hashedPassword: `${bcrypt.hashSync("password1", 10)}`
  },
  "user2": {
    id: "user2",
    email: "user2@example.com",
    hashedPassword: `${bcrypt.hashSync("password2", 10)}`
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

function verifyEmail(email) {
  for (let userID in users) {
    if (users[userID].email === email) {
      return userID;
    }
  }
  return false;
};

function verifyPassword(user_id, password) {
  return (users[user_id].hashedPassword === password);
}

function urlsForUser(id) {
  let urlsForUser = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlsForUser[url] = urlDatabase[url];
    }
  }
  return urlsForUser;
}

app.get("/", (req, res) => {
  let user = getUser(req.session.user_id);
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let user = getUser(req.session.user_id);
    res.render("urls_login", {user: user});
  }
});

app.post("/login", (req, res) => {
  let user_id = verifyEmail(req.body.email);
  const email = req.body.email;
  const password = req.body.password;

  for (let i in users) {
    if (users[i].email === email) {
      if (bcrypt.compareSync(password, users[i].hashedPassword)) {
        req.session.user_id = i;
        res.redirect("/urls");
      }
    }
  }
  res.status(403).send("Email or password is incorrect.")
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
  res.render("urls_register");
}
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10)

  if (!email || !password) {
    res.status(400).send("Please enter an email and a password.");
  } else if (findUserByEmail(email)) {
    res.status(400).send("Email has already been used.")
  } else {
    let userID = generateRandomString(4);
    users[userID] = { id: userID,
                      email: email,
                      hashedPassword: hashedPassword };
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
    let templateVars = { user: req.session.user_id,
                         urls: urlsForUser(req.session.user_id) };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: req.session.user_id }
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
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
  if (!(req.params.id in urlDatabase)) {
    res.status(302).send("Shortened URL does not exist.");
  } else {
    let userID = urlDatabase[req.params.id].userID;
    if (req.session.user_id !== userID) {
      res.status(403).send("You do not have permission to view this URL.")
    } else if (req.session.user_id === userID) {
      let templateVars = { user: getUser(req.session.user_id),
                           shortURL: req.params.id,
                           urls: urlsForUser(req.session.user_id) };
      res.render("urls_show", templateVars);
    }
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let userID = urlDatabase[req.params.id].userID;

  if (req.session.user_id === userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).send("You do not have permission to modify this link.");
  }
});

app.post("/urls/:id/update", (req, res) => {
  let userID = urlDatabase[req.params.id].userID;

  if (req.session.user_id === userID) {
    if (!req.body.longURL) {
      res.status(400).send("Please input a new URL.");
    } else {
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect("/urls/" + req.params.id);
    }
  } else {
    res.status(403).send("You do not have permission to modify this link.");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


















