/**
 * Session ratings (1-5) and comments. Mounted at /api/sessions/:sessionId
 * Routes: GET/POST /ratings, GET/POST /comments
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/authMiddleware").optionalAuth;
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

function getSessionId(req) {
  return req.params.sessionId;
}

/** GET /ratings - list ratings for session + average; optional my_rating when authenticated */
router.get("/ratings", optionalAuth, async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ success: false, error: "Session not found" });

    const { data, error } = await supabase
      .from("session_ratings")
      .select("id, user_id, rating, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const ratings = data || [];
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
    let my_rating = null;
    if (req.user && req.user.id) {
      const mine = ratings.find((r) => r.user_id === req.user.id);
      if (mine) my_rating = mine.rating;
    }
    res.json({ success: true, ratings, average: Math.round(avg * 10) / 10, count: ratings.length, my_rating });
  } catch (err) {
    console.error("ratings list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST /ratings - submit or update rating 1-5 (auth) */
router.post("/ratings", authMiddleware, async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { rating } = req.body;

    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ success: false, error: "Session not found" });

    const r = parseInt(rating, 10);
    if (isNaN(r) || r < 1 || r > 5) return res.status(400).json({ success: false, error: "Rating must be 1-5" });

    const { data: existing } = await supabase
      .from("session_ratings")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (existing) {
      const { data: updated, error: upErr } = await supabase
        .from("session_ratings")
        .update({ rating: r })
        .eq("session_id", sessionId)
        .eq("user_id", req.user.id)
        .select()
        .single();
      if (upErr) throw upErr;
      return res.json({ success: true, rating: updated });
    }

    const { data, error } = await supabase
      .from("session_ratings")
      .insert([{ session_id: sessionId, user_id: req.user.id, rating: r }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, rating: data });
  } catch (err) {
    console.error("ratings post error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** GET /comments - list comments for session */
router.get("/comments", async (req, res) => {
  try {
    const sessionId = getSessionId(req);

    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ success: false, error: "Session not found" });

    const { data, error } = await supabase
      .from("session_comments")
      .select("id, user_id, body, created_at, users(firstname, lastname)")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ success: true, comments: data || [] });
  } catch (err) {
    console.error("comments list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST /comments - add comment (auth) */
router.post("/comments", authMiddleware, async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { body } = req.body;

    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ success: false, error: "Session not found" });

    if (!body || !String(body).trim()) return res.status(400).json({ success: false, error: "Comment text is required" });

    const { data, error } = await supabase
      .from("session_comments")
      .insert([{ session_id: sessionId, user_id: req.user.id, body: String(body).trim().slice(0, 1000) }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, comment: data });
  } catch (err) {
    console.error("comments post error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
