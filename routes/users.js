// backend/routes/users.js
const express = require("express");
const supabase = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware"); // 🔒 import middleware
const router = express.Router();

/* =====================================================
   ✅ Get all users (Protected - e.g. for admin dashboard)
===================================================== */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, firstname, lastname, email, created_at");

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, users: data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================================================
   ✅ Get current user profile (Protected)
===================================================== */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; //  from JWT
    const { data, error } = await supabase
      .from("users")
      .select("id, firstname, lastname, email, created_at")
      .eq("id", userId)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
