import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// ── Helper: build the JWT token payload ────────────────────────────
function createToken(user) {
  return jwt.sign(
    { userId: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ── REGISTER ────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields are required" });

    const userExists = await User.findOne({ email });
    if (userExists) {
      // Helpful message if they registered via Google before
      if (userExists.authProvider === "google") {
        return res.status(400).json({ msg: "This email is already registered via Google Sign-In. Please use Google Login." });
      }
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
    });

    res.json({ msg: "User registered", user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LOGIN ────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    // Guard: Google-only account trying to use password login
    if (user.authProvider === "google") {
      return res.status(400).json({ msg: "This account uses Google Sign-In. Please login with Google." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = createToken(user);

    res.json({
      msg: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture }
    });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GOOGLE OAUTH ─────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // New Google user — store a hashed random UUID as password (not usable for login)
      const dummyPassword = await bcrypt.hash(uuidv4(), 10);
      user = await User.create({
        name,
        email,
        password: dummyPassword,
        authProvider: "google",
        picture: picture || null,
      });
    } else if (user.authProvider === "local") {
      // Existing email/password user signing in with Google — update their provider
      user.authProvider = "google";
      user.picture = picture || user.picture;
      await user.save();
    }

    const jwtToken = createToken(user);

    res.json({
      msg: "Google Login Success",
      token: jwtToken,
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture }
    });

  } catch (err) {
    console.error("[Auth] Google OAuth error:", err.message);
    res.status(400).json({ msg: "Google authentication failed" });
  }
});


export default router;
