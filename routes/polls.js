/**
 * Polls per event (or per session). Mounted at /api/events/:id/polls
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

function getEventId(req) {
  return req.params.id;
}

/** GET - list polls (public) */
router.get("/", async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, polls: data || [] });
  } catch (err) {
    console.error("polls list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST - create poll (host only) */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { question, options, session_id } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can create polls" });

    if (!question || !question.trim()) return res.status(400).json({ success: false, error: "Question is required" });
    const opts = Array.isArray(options) ? options : [];
    if (opts.length < 2) return res.status(400).json({ success: false, error: "At least 2 options required" });

    const { data, error } = await supabase
      .from("polls")
      .insert([{
        event_id: eventId,
        session_id: session_id || null,
        question: question.trim(),
        options: opts,
        status: "draft",
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, poll: data });
  } catch (err) {
    console.error("polls create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** PATCH /:pollId - update (e.g. status: live | closed) (host only) */
router.patch("/:pollId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { pollId } = req.params;
    const { status } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can update polls" });

    const updates = {};
    if (status !== undefined) {
      if (!["draft", "live", "closed"].includes(status)) return res.status(400).json({ success: false, error: "Invalid status" });
      updates.status = status;
      if (status === "closed") updates.closed_at = new Date().toISOString();
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, error: "No fields to update" });

    const { data, error } = await supabase
      .from("polls")
      .update(updates)
      .eq("id", pollId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, poll: data });
  } catch (err) {
    console.error("polls update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** GET /:pollId/results - get poll with vote counts (public) */
router.get("/:pollId/results", async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { pollId } = req.params;

    const { data: poll, error: pollErr } = await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .eq("event_id", eventId)
      .maybeSingle();
    if (pollErr || !poll) return res.status(404).json({ success: false, error: "Poll not found" });

    const { data: votes } = await supabase
      .from("poll_votes")
      .select("option_index")
      .eq("poll_id", pollId);

    const counts = (poll.options || []).map((_, i) => ({ option_index: i, label: poll.options[i], count: (votes || []).filter((v) => v.option_index === i).length }));
    res.json({ success: true, poll: { ...poll, results: counts, total_votes: (votes || []).length } });
  } catch (err) {
    console.error("polls results error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST /:pollId/vote - cast vote (auth, one per user) */
router.post("/:pollId/vote", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { pollId } = req.params;
    const { option_index } = req.body;

    const { data: poll, error: pollErr } = await supabase
      .from("polls")
      .select("id, options, status")
      .eq("id", pollId)
      .eq("event_id", eventId)
      .maybeSingle();
    if (pollErr || !poll) return res.status(404).json({ success: false, error: "Poll not found" });
    if (poll.status !== "live") return res.status(400).json({ success: false, error: "Poll is not open for voting" });

    const idx = parseInt(option_index, 10);
    if (isNaN(idx) || idx < 0 || idx >= (poll.options || []).length) {
      return res.status(400).json({ success: false, error: "Invalid option" });
    }

    const { data, error } = await supabase
      .from("poll_votes")
      .insert([{ poll_id: pollId, user_id: req.user.id, option_index: idx }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return res.status(400).json({ success: false, error: "You have already voted" });
      throw error;
    }
    res.json({ success: true, vote: data });
  } catch (err) {
    console.error("polls vote error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
