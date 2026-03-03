/**
 * Sessions (schedule) per event. Mounted at /api/events/:id/sessions
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

function getEventId(req) {
  return req.params.id;
}

/** GET - list sessions (public) */
router.get("/", async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { data, error } = await supabase
      .from("sessions")
      .select("*, session_speakers(speaker_id, speakers(id, name, bio, avatar_url, linkedin_url, twitter_handle))")
      .eq("event_id", eventId)
      .order("start_time", { ascending: true });

    if (error) throw error;
    res.json({ success: true, sessions: data || [] });
  } catch (err) {
    console.error("sessions list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** GET /bookmarks - list current user's bookmarks for this event (auth) */
router.get("/bookmarks", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("event_id", eventId);
    const sessionIds = (sessions || []).map((s) => s.id);
    if (sessionIds.length === 0) return res.json({ success: true, bookmarks: [] });

    const { data, error } = await supabase
      .from("session_bookmarks")
      .select("session_id, created_at")
      .eq("user_id", req.user.id)
      .in("session_id", sessionIds);

    if (error) throw error;
    res.json({ success: true, bookmarks: data || [] });
  } catch (err) {
    console.error("bookmarks list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST /:sessionId/bookmark - add bookmark (auth) */
router.post("/:sessionId/bookmark", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { sessionId } = req.params;

    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("event_id", eventId)
      .maybeSingle();
    if (sessErr || !session) return res.status(404).json({ success: false, error: "Session not found" });

    const { data, error } = await supabase
      .from("session_bookmarks")
      .insert([{ user_id: req.user.id, session_id: sessionId }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return res.json({ success: true, bookmark: { session_id: sessionId } });
      throw error;
    }
    res.status(201).json({ success: true, bookmark: data });
  } catch (err) {
    console.error("bookmark add error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** DELETE /:sessionId/bookmark - remove bookmark (auth) */
router.delete("/:sessionId/bookmark", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { error } = await supabase
      .from("session_bookmarks")
      .delete()
      .eq("user_id", req.user.id)
      .eq("session_id", sessionId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("bookmark remove error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST - create (host only) */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { title, description, start_time, end_time, room, location, capacity, speaker_ids, meeting_url } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage sessions" });

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: "title, start_time, end_time required" });
    }

    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .insert([{
        event_id: eventId,
        title,
        description: description || null,
        start_time,
        end_time,
        room: room || null,
        location: location || null,
        capacity: capacity != null ? parseInt(capacity, 10) : null,
        meeting_url: meeting_url && String(meeting_url).trim() ? String(meeting_url).trim() : null,
      }])
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    const ids = Array.isArray(speaker_ids) ? speaker_ids : [];
    if (ids.length > 0) {
      await supabase.from("session_speakers").insert(ids.map((speaker_id) => ({ session_id: session.id, speaker_id })));
    }

    const { data: full } = await supabase
      .from("sessions")
      .select("*, session_speakers(speaker_id, speakers(id, name, bio, avatar_url))")
      .eq("id", session.id)
      .single();

    res.status(201).json({ success: true, session: full || session });
  } catch (err) {
    console.error("sessions create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** PATCH /:sessionId */
router.patch("/:sessionId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { sessionId } = req.params;
    const { title, description, start_time, end_time, room, location, capacity, speaker_ids, meeting_url } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage sessions" });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (room !== undefined) updates.room = room;
    if (location !== undefined) updates.location = location;
    if (capacity !== undefined) updates.capacity = capacity == null ? null : parseInt(capacity, 10);
    if (meeting_url !== undefined) updates.meeting_url = meeting_url && String(meeting_url).trim() ? String(meeting_url).trim() : null;
    updates.updated_at = new Date().toISOString();

    const { error: upErr } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("event_id", eventId);
    if (upErr) throw upErr;

    if (Array.isArray(speaker_ids)) {
      await supabase.from("session_speakers").delete().eq("session_id", sessionId);
      if (speaker_ids.length > 0) {
        await supabase.from("session_speakers").insert(speaker_ids.map((speaker_id) => ({ session_id: sessionId, speaker_id })));
      }
    }

    const { data: full, error: selErr } = await supabase
      .from("sessions")
      .select("*, session_speakers(speaker_id, speakers(id, name, bio, avatar_url))")
      .eq("id", sessionId)
      .single();

    if (selErr) throw selErr;
    res.json({ success: true, session: full });
  } catch (err) {
    console.error("sessions update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** DELETE /:sessionId */
router.delete("/:sessionId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { sessionId } = req.params;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage sessions" });

    const { error } = await supabase.from("sessions").delete().eq("id", sessionId).eq("event_id", eventId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("sessions delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
