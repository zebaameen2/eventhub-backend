/**
 * Ticket types per event (VIP, General, etc.)
 * Mounted at /api/events/:id/ticket-types - use req.params.id as event_id
 */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router({ mergeParams: true });

function getEventId(req) {
  return req.params.id;
}

/** GET /api/events/:id/ticket-types - list ticket types (public) */
router.get("/", async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { data, error } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ success: true, ticket_types: data || [] });
  } catch (err) {
    console.error("ticket-types list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST /api/events/:id/ticket-types - create (host only) */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { name, description, price_cents, quantity_limit } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage ticket types" });

    if (!name || !name.trim()) return res.status(400).json({ success: false, error: "Name is required" });

    const { data, error } = await supabase
      .from("ticket_types")
      .insert([{
        event_id: eventId,
        name: name.trim(),
        description: description || null,
        price_cents: price_cents != null ? parseInt(price_cents, 10) : 0,
        quantity_limit: quantity_limit != null ? parseInt(quantity_limit, 10) : null,
        sold_count: 0,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, ticket_type: data });
  } catch (err) {
    console.error("ticket-types create error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** PATCH /api/events/:id/ticket-types/:ticketId - update (host only) */
router.patch("/:ticketId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { ticketId } = req.params;
    const { name, description, price_cents, quantity_limit } = req.body;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage ticket types" });

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description || null;
    if (price_cents !== undefined) updates.price_cents = parseInt(price_cents, 10);
    if (quantity_limit !== undefined) updates.quantity_limit = quantity_limit == null ? null : parseInt(quantity_limit, 10);
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, error: "No fields to update" });

    const { data: existing } = await supabase.from("ticket_types").select("sold_count").eq("id", ticketId).eq("event_id", eventId).maybeSingle();
    if (!existing) return res.status(404).json({ success: false, error: "Ticket type not found" });
    if (updates.quantity_limit != null && existing.sold_count > updates.quantity_limit) {
      return res.status(400).json({ success: false, error: "Quantity limit cannot be less than already sold" });
    }

    const { data, error } = await supabase
      .from("ticket_types")
      .update(updates)
      .eq("id", ticketId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, ticket_type: data });
  } catch (err) {
    console.error("ticket-types update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** DELETE /api/events/:id/ticket-types/:ticketId */
router.delete("/:ticketId", authMiddleware, async (req, res) => {
  try {
    const eventId = getEventId(req);
    const { ticketId } = req.params;

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !event) return res.status(404).json({ success: false, error: "Event not found" });
    if (event.created_by !== req.user.id) return res.status(403).json({ success: false, error: "Only event host can manage ticket types" });

    const { error } = await supabase.from("ticket_types").delete().eq("id", ticketId).eq("event_id", eventId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("ticket-types delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
