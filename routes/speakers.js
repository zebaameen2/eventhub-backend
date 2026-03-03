/**
 * Speakers per event. Mounted at /api/events/:id/speakers
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

function getEventId(req) {
  return req.params.id;
}

/** GET - list (public) */
router.get("/", async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { data, error } = await supabase
      .from("speakers")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    res.json({ success: true, speakers: data || [] });
  } catch (err) {
    console.error("speakers list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST - create (host only) */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { name, bio, avatar_url, linkedin_url, twitter_handle, display_order } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage speakers" });

    if (!name || !name.trim()) return res.status(400).json({ success: false, error: "Name is required" });

    const { data, error } = await supabase
      .from("speakers")
      .insert([{
        event_id: eventId,
        name: name.trim(),
        bio: bio || null,
        avatar_url: avatar_url || null,
        linkedin_url: linkedin_url || null,
        twitter_handle: twitter_handle || null,
        display_order: display_order != null ? parseInt(display_order, 10) : 0,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, speaker: data });
  } catch (err) {
    console.error("speakers create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** PATCH /:speakerId */
router.patch("/:speakerId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { speakerId } = req.params;
    const { name, bio, avatar_url, linkedin_url, twitter_handle, display_order } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage speakers" });

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
    if (twitter_handle !== undefined) updates.twitter_handle = twitter_handle;
    if (display_order !== undefined) updates.display_order = parseInt(display_order, 10);

    const { data, error } = await supabase
      .from("speakers")
      .update(updates)
      .eq("id", speakerId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, speaker: data });
  } catch (err) {
    console.error("speakers update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** DELETE /:speakerId */
router.delete("/:speakerId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { speakerId } = req.params;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage speakers" });

    const { error } = await supabase.from("speakers").delete().eq("id", speakerId).eq("event_id", eventId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("speakers delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
