const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true })); // Parse HTML form data
app.use(cookieParser());

// ⭐️ Simple in-memory session store (for demo purposes only)
const sessions = {}; // { sessionId: { username } }

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send('<h3>Username is required</h3><a href="/login">Try again</a>');
  }

  // Generate a random session ID
  const sessionId = crypto.randomBytes(16).toString("hex");

  // Store user info in memory
  sessions[sessionId] = { username };

  // Set cookie
  res.cookie("sessionId", sessionId, {
    httpOnly: true,
    sameSite: "Lax",
    // secure: true, // Enable when using HTTPS
    maxAge: 1000 * 60 * 30, // 30 minutes
  });

  // Redirect to profile page
  res.redirect("/profile");
});

// Protected route (requires a valid session)
app.get("/profile", (req, res) => {
  const { sessionId } = req.cookies;

  if (!sessionId || !sessions[sessionId]) {
    return res.redirect("/login");
  }

  const user = sessions[sessionId];
  res.send(`
    <h2>Welcome, ${user.username}!</h2>
    <p>This is your profile page.</p>
    <form action="/logout" method="POST">
      <button type="submit">Logout</button>
    </form>
  `);
});

// Logout route
app.post("/logout", (req, res) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    delete sessions[sessionId];
  }
  res.clearCookie("sessionId");
  res.redirect("/login");
});

// Start the server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
