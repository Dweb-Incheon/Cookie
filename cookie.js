const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); // parse form data

// assume these are stored securely in a database
const USERS = {
  Park: "1029", // username: password
  Lee: "3042",
  Kim: "2323",
};

// login page
app.get("/login", (req, res) => {
  res.send(`
    <h2>Login Page</h2>
    <form method="POST" action="/login">
      <input name="username" placeholder="username" />
      <input name="password" type="password" placeholder="password" />
      <button type="submit">Login</button>
    </form>
  `);
});

// login handler
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (USERS[username] && USERS[username] === password) {
    // if login success, set cookie
    res.cookie("user", username, {
      httpOnly: true, // Prevent XSS
      secure: false, // HTTPS 전용 (배포 시 true로 변경)
      sameSite: "lax", // Prevent CSRF
      maxAge: 1000 * 60 * 10, // 10분
    });
    res.send(`<p>Login Success 🍪 <a href="/profile"> My Profie </a></p>`);
  } else {
    res.status(401).send("Login failed ❌ <a href='/login'>Try again</a>");
  }
});

// authenticated profile page
app.get("/profile", (req, res) => {
  const username = req.cookies.user;

  if (!username) {
    res.status(401).send("<a href='/login'> Login </a>");
    return;
  }

  res.send(`
    <h2>Welcome, ${username}🎉</h2>
    <a href="/logout">Logout</a>
  `);
});

// if logout, clear cookie
app.get("/logout", (req, res) => {
  res.clearCookie("user");
  res.send("Logout 🧹 <a href='/login'>Login again</a>");
});

app.listen(port, () => {
  console.log(`🚀 Running on http://localhost:${port}`);
});
