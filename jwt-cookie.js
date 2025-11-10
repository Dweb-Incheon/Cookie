const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.urlencoded({ extended: true })); // Parse HTML form data
app.use(cookieParser());

// Load ECDSA key pair (ES256 uses P-256 curve)
const PRIVATE_KEY = fs.readFileSync(path.join(__dirname, "ec-private-key.pem"), "utf8");
const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, "ec-public-key.pem"), "utf8");

// Serve login form
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send('<h3>Username is required</h3><a href="/login">Try again</a>');
  }

  // Create JWT payload
  const payload = { username };

  // Sign JWT with ECDSA (ES256)
  const token = jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "ES256", // Use ECDSA with P-256 + SHA-256
    expiresIn: "30m",
  });

  // Store JWT in HttpOnly cookie
  res.cookie("access_token", token, {
    httpOnly: true, // Protects against XSS
    sameSite: "Lax", // Good default for same-site forms
    // secure: true,      // Enable this when running over HTTPS
    maxAge: 1000 * 60 * 30,
  });

  res.redirect("/profile");
});

// Middleware: verify JWT from cookie using public key
function authenticateJWT(req, res, next) {
  const token = req.cookies.access_token;

  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(
    token,
    PUBLIC_KEY,
    { algorithms: ["ES256"] }, // Only allow ES256
    (err, decoded) => {
      if (err) {
        console.log("JWT verification failed:", err.message);
        return res.redirect("/login");
      }

      req.user = decoded;
      next();
    }
  );
}

// Protected route
app.get("/profile", authenticateJWT, (req, res) => {
  res.send(`
    <h2>Welcome, ${req.user.username}!</h2>
    <p>This page is protected by a JWT signed with ECDSA (ES256) and stored in an HttpOnly cookie.</p>
    <form action="/logout" method="POST">
      <button type="submit">Logout</button>
    </form>
  `);
});

// Logout: just clear the cookie (no server-side state)
app.post("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/login");
});

// Start server
app.listen(3000, () => {
  console.log("✅ ECDSA JWT cookie demo running at http://localhost:3000");
});
