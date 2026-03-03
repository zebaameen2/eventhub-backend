/**
 * Q&A per event/session. Mounted at /api/events/:id/questions
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

function getEventId(req) {
  return req.params.id;
}

/** GET - list questions (optional ?session_id=) */
router.get("/", async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { session_id } = req.query;

    let q = supabase
      .from("questions")
      .select("id, event_id, session_id, user_id, text, answer, answered_at, created_at, users(firstname, lastname)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (session_id) q = q.eq("session_id", session_id);

    const { data, error } = await q;

    if (error) throw error;
    res.json({ success: true, questions: data || [] });
  } catch (err) {
    console.error("questions list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST - submit question (auth) */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { text, session_id } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });

    if (!text || !text.trim()) return res.status(400).json({ success: false, error: "Question text is required" });

    const { data, error } = await supabase
      .from("questions")
      .insert([{
        event_id: eventId,
        session_id: session_id || null,
        user_id: req.user.id,
        text: text.trim(),
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, question: data });
  } catch (err) {
    console.error("questions create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** PATCH /:questionId/answer - add answer (host/moderator) */
router.patch("/:questionId/answer", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { questionId } = req.params;
    const { answer } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can answer questions" });

    if (!answer || !answer.trim()) return res.status(400).json({ success: false, error: "Answer is required" });

    const { data, error } = await supabase
      .from("questions")
      .update({
        answer: answer.trim(),
        answered_at: new Date().toISOString(),
        answered_by: req.user.id,
      })
      .eq("id", questionId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, question: data });
  } catch (err) {
    console.error("questions answer error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
