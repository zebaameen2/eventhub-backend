/**
 * Announcements per event. Mounted at /api/events/:id/announcements
 * Admin can create; optional email fallback to registered attendees.
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

const EMAIL_API_URL = "https://send-grid-api.vercel.app/sendemail";

async function sendMail(to, subject, text) {
  try {
    const res = await fetch(EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: to, subject, message: text }),
    });
    if (res.ok) console.log("✅ Announcement email sent to", to);
    else console.warn("Email API returned", res.status);
  } catch (err) {
    console.warn("Announcement email failed:", err.message);
  }
}

function getEventId(req) {
  return req.params.id;
}

/** GET - list announcements (public) */
router.get("/", async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { data, error } = await supabase
      .from("announcements")
      .select("id, event_id, created_by, title, body, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, announcements: data || [] });
  } catch (err) {
    console.error("announcements list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST - create announcement (host only); optional send_email to all registered */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { title, body, send_email } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by, eventname")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can create announcements" });

    if (!title || !title.trim()) return res.status(400).json({ success: false, error: "Title is required" });

    const { data: ann, error } = await supabase
      .from("announcements")
      .insert([{
        event_id: eventId,
        created_by: req.user.id,
        title: title.trim(),
        body: (body || "").trim(),
      }])
      .select()
      .single();

    if (error) throw error;

    if (send_email) {
      const { data: regs } = await supabase
        .from("registrations")
        .select("user_id, users(email)")
        .eq("event_id", eventId)
        .eq("confirm", "accept");
      const emails = (regs || []).map((r) => r.users?.email).filter(Boolean);
      const subject = `[${event.eventname}] ${ann.title}`;
      const text = ann.body + "\n\n— Event team";
      for (const email of emails) {
        await sendMail(email, subject, text);
      }
    }

    res.status(201).json({ success: true, announcement: ann });
  } catch (err) {
    console.error("announcements create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** DELETE /:announcementId (host only) */
router.delete("/:announcementId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { announcementId } = req.params;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can delete announcements" });

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId)
      .eq("event_id", eventId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("announcements delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
