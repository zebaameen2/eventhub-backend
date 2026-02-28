const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");
const nodemailer = require("nodemailer");

const router = express.Router();

// helper to guard confirm operations; if the column doesn't exist we will
// simply skip updates to it.
let hasConfirmCol = null;
async function checkConfirmCol() {
  if (hasConfirmCol !== null) return hasConfirmCol;
  try {
    const { error } = await supabase.from("registrations").select("confirm").limit(1);
    hasConfirmCol = !error;
  } catch (err) {
    hasConfirmCol = false;
  }
  return hasConfirmCol;
}

// mailer setup (production uses real SMTP, dev logs)
let mailer = null;
if (process.env.SMTP_HOST) {
  console.log("🔧 SMTP configured:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
  });
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  // Test the connection
  mailer.verify((err, success) => {
    if (err) {
      console.error("❌ SMTP connection failed:", err.message);
    } else {
      console.log("✅ SMTP connection verified");
    }
  });
} else {
  console.log("⚠️  SMTP not configured — using dev mode");
}

async function sendMail(to, subject, text) {
  if (!mailer) {
    console.log("📝 DEV MAIL (not sent)", { to, subject, text });
    return;
  }
  try {
    const info = await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    });
    console.log("✅ EMAIL SENT:", { to, subject, messageId: info.messageId });
  } catch (err) {
    console.error("❌ EMAIL SEND FAILED:", { to, subject, error: err.message });
    throw err;
  }
}

// Accept registration
router.put("/:id/accept", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 ACCEPT REQUEST for registration:", id);

    // fetch registration + user + event for email
    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("user_id,event_id")
      .eq("id", id)
      .maybeSingle();
    if (regErr) throw regErr;
    if (!reg) return res.status(404).json({ success: false, error: "Registration not found" });

    const { data: user } = await supabase
      .from("users")
      .select("firstname,lastname,email")
      .eq("id", reg.user_id)
      .maybeSingle();
    const { data: event } = await supabase
      .from("events")
      .select("eventname")
      .eq("id", reg.event_id)
      .maybeSingle();

    // send acceptance email (async but awaited to catch errors)
    if (user?.email) {
      console.log("📧 Sending acceptance email to:", user.email);
      try {
        await sendMail(
          user.email,
          `Accepted for ${event?.eventname || "your event"}`,
          `Hello ${user.firstname || ""},\n\nYou have been accepted for ${event?.eventname || "the event"}.\n\nSee you there!`
        );
      } catch (mailErr) {
        console.error("⚠️  Email send failed:", mailErr.message);
        // Continue anyway, don't fail the whole accept
      }
    }

    // Update confirm status to "accept" only if column exists
    console.log("💾 Updating registration confirm status to accept");
    const hasConfirm = await checkConfirmCol();
    if (hasConfirm) {
      const { error: updateErr } = await supabase
        .from("registrations")
        .update({ confirm: "accept" })
        .eq("id", id);
      if (updateErr) {
        console.error("❌ UPDATE ERROR:", updateErr);
        throw updateErr;
      }
    } else {
      console.log("⚠️  confirm column does not exist, skipping update");
    }

    console.log("✅ REGISTRATION ACCEPTED:", { id });
    res.json({ success: true, message: "Registration accepted" });
  } catch (err) {
    console.error("❌ ACCEPT ENDPOINT ERROR:", err.message || err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reject registration (DELETE from DB permanently)
router.put("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("user_id,event_id")
      .eq("id", id)
      .maybeSingle();
    if (regErr) throw regErr;
    if (!reg) return res.status(404).json({ success: false, error: "Registration not found" });

    const { data: user } = await supabase
      .from("users")
      .select("firstname,lastname,email")
      .eq("id", reg.user_id)
      .maybeSingle();
    const { data: event } = await supabase
      .from("events")
      .select("eventname")
      .eq("id", reg.event_id)
      .maybeSingle();

    // Send rejection email
    if (user?.email) {
      await sendMail(
        user.email,
        `Update on ${event?.eventname || "your event"}`,
        `Hello ${user.firstname || ""},\n\nUnfortunately your registration for ${event?.eventname || "the event"} was not accepted.\n\nThank you for your interest.`
      );
    }

    // PERMANENTLY DELETE the registration from database
    const { error: deleteErr } = await supabase
      .from("registrations")
      .delete()
      .eq("id", id);
    if (deleteErr) throw deleteErr;

    console.log("🗑️  REGISTRATION DELETED:", { id });
    res.json({ success: true, message: "Registration rejected and deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// delete registration (host only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
