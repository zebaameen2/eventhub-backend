/**
 * Session chat messages. Mounted at /api/sessions/:sessionId/chat
 * (session belongs to an event; we validate session exists)
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

function getSessionId(req) {
  return req.params.sessionId;
}

/** GET - list messages (auth for event context optional; public read for now) */
router.get("/", async (req, res) => {
  try {
    const sessionId = getSessionId(req);

    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ success: false, error: "Session not found" });

    const { data, error } = await supabase
      .from("session_chat_messages")
      .select("id, session_id, user_id, body, created_at, users(firstname, lastname)")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ success: true, messages: data || [] });
  } catch (err) {
    console.error("session chat list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST - send message (auth) */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { body } = req.body;

    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ success: false, error: "Session not found" });

    if (!body || !String(body).trim()) return res.status(400).json({ success: false, error: "Message body is required" });

    const { data, error } = await supabase
      .from("session_chat_messages")
      .insert([{
        session_id: sessionId,
        user_id: req.user.id,
        body: String(body).trim().slice(0, 2000),
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, message: data });
  } catch (err) {
    console.error("session chat send error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
