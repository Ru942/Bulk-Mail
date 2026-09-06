const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// ======================================================
// CORS — allow all origins (Vercel frontend + local dev)
// ======================================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ======================================================
// MONGODB CONNECTION (lazy — reuse across warm lambdas)
// ======================================================

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  console.log("✅ MongoDB connected successfully");
}

// ======================================================
// EMAIL LOG MODEL
// ======================================================

const EmailLog =
  mongoose.models.EmailLog ||
  mongoose.model(
    "EmailLog",
    new mongoose.Schema({
      subject: { type: String, default: "" },
      body: { type: String, default: "" },
      recipient: { type: String, required: true },
      messagePreview: { type: String, default: "" },
      status: { type: String, enum: ["sent", "failed"], required: true },
      errorReason: { type: String, default: null },
      sentAt: { type: Date, default: Date.now },
    })
  );

// ======================================================
// NODEMAILER
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================================================
// EMAIL VALIDATION
// ======================================================

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Authorization token required." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Invalid authorization format." });
  }

  jwt.verify(token, process.env.JWT_SECRET, function (error, user) {
    if (error) {
      return res.status(403).json({ success: false, message: "Token expired or invalid." });
    }
    req.user = user;
    next();
  });
}

// ======================================================
// ADMIN LOGIN
// ======================================================

app.post("/api/auth/login", async function (req, res) {
  try {
    await connectDB();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "8h" });

    res.json({ success: true, message: "Login successful.", token, username });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ success: false, message: "Login failed." });
  }
});

// ======================================================
// SEND BULK EMAIL
// ======================================================

app.post("/api/sendemail", authenticateToken, async function (req, res) {
  try {
    await connectDB();

    const subject = req.body.subject;
    const msg = req.body.msg;
    const emails = req.body.emails;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: "Email subject is required." });
    }

    if (!msg || !msg.trim()) {
      return res.status(400).json({ success: false, message: "Email message is required." });
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: "At least one recipient email is required." });
    }

    const cleanedEmails = [
      ...new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean)),
    ];

    const validEmails = cleanedEmails.filter(isValidEmail);
    const invalidEmails = cleanedEmails.filter((e) => !isValidEmail(e));

    let sentCount = 0;
    let failedCount = 0;

    for (const email of validEmails) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: subject.trim(),
          text: msg,
        });

        sentCount++;
        console.log("✅ Email sent to:", email);

        EmailLog.create({
          subject: subject.trim(),
          body: msg,
          recipient: email,
          messagePreview: msg.slice(0, 80),
          status: "sent",
        }).catch((e) => console.error("❌ DB log error:", e.message));
      } catch (error) {
        failedCount++;
        console.error("❌ Failed to send to:", email, error.message);

        EmailLog.create({
          subject: subject.trim(),
          body: msg,
          recipient: email,
          messagePreview: msg.slice(0, 80),
          status: "failed",
          errorReason: error.message,
        }).catch((e) => console.error("❌ DB log error:", e.message));
      }
    }

    res.json({
      success: true,
      message: `${sentCount} sent, ${failedCount} failed.`,
      sentCount,
      failedCount,
      total: cleanedEmails.length,
      invalidEmails,
    });
  } catch (error) {
    console.error("❌ Send email API error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong while sending emails.", error: error.message });
  }
});

// ======================================================
// GET EMAIL LOGS
// ======================================================

app.get("/api/logs", authenticateToken, async function (req, res) {
  try {
    await connectDB();
    const logs = await EmailLog.find().sort({ sentAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error("❌ Failed to fetch logs:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch logs." });
  }
});

// ======================================================
// DELETE ALL LOGS
// ======================================================

app.delete("/api/logs", authenticateToken, async function (req, res) {
  try {
    await connectDB();
    await EmailLog.deleteMany({});
    console.log("🗑️ All email logs cleared.");
    res.json({ success: true, message: "All logs cleared." });
  } catch (error) {
    console.error("❌ Failed to clear logs:", error.message);
    res.status(500).json({ success: false, message: "Failed to clear logs." });
  }
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", function (req, res) {
  res.json({ success: true, message: "Bulk Mail backend is running." });
});

// ======================================================
// VERCEL SERVERLESS EXPORT
// ======================================================

module.exports = app;
