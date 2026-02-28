// const express = require("express");
// const multer = require("multer");
// const router = express.Router();
// const supabase = require("../supabaseClient");

// // Multer memory storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// /* =====================================================
//    ✅ CREATE EVENT
// ===================================================== */
// router.post(
//   "/",
//   upload.fields([
//     { name: "banner", maxCount: 1 },
//     { name: "card", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       const {
//         eventname,
//         description,
//         hostname,
//         eventdate,
//         email,
//         country,
//         address,
//         city,
//         state,
//         postal,
//         audience,
//         type,
//         attendees,
//         price,
//         tech,
//         agenda,
//         twitter,
//         website,
//         linkedin,
//         instagram,
//         created_by, // 👈 VERY IMPORTANT
//       } = req.body;

//       const approval = req.body.approval === "true";
//       const sponsors = JSON.parse(req.body.sponsors || "[]");

//       let banner_url = null;
//       let card_url = null;

//       /* ========= Upload Banner ========= */
//       if (req.files?.banner?.length) {
//         const file = req.files.banner[0];
//         const fileName = `banner_${Date.now()}_${file.originalname}`;

//         const { error } = await supabase.storage
//           .from("events")
//           .upload(fileName, file.buffer, {
//             contentType: file.mimetype,
//           });

//         if (error) throw error;

//         banner_url = supabase.storage
//           .from("events")
//           .getPublicUrl(fileName).data.publicUrl;
//       }

//       /* ========= Upload Card ========= */
//       if (req.files?.card?.length) {
//         const file = req.files.card[0];
//         const fileName = `card_${Date.now()}_${file.originalname}`;

//         const { error } = await supabase.storage
//           .from("events")
//           .upload(fileName, file.buffer, {
//             contentType: file.mimetype,
//           });

//         if (error) throw error;

//         card_url = supabase.storage
//           .from("events")
//           .getPublicUrl(fileName).data.publicUrl;
//       }

//       /* ========= Insert Into DB ========= */
//       const { data, error } = await supabase
//         .from("events")
//         .insert([
//           {
//             eventname,
//             description,
//             hostname,
//             eventdate,
//             email,
//             country,
//             address,
//             city,
//             state,
//             postal,
//             audience,
//             type,
//             attendees: attendees ? parseInt(attendees) : null,
//             price: price ? parseFloat(price) : null,
//             tech,
//             agenda,
//             twitter,
//             website,
//             linkedin,
//             instagram,
//             approval,
//             sponsors,
//             banner_url,
//             card_url,
//             created_by, // 👈 SAVE USER ID
//           },
//         ])
//         .select()
//         .single();

//       if (error) throw error;

//       res.json({ success: true, event: data });
//     } catch (err) {
//       console.error("CREATE ERROR:", err);
//       res.status(500).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   }
// );

// /* =====================================================
//    ✅ GET ALL EVENTS
// ===================================================== */
// router.get("/", async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("events")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     res.json({ success: true, events: data });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

// /* =====================================================
//    ✅ GET MY EVENTS
// ===================================================== */
// router.get("/my/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const { data, error } = await supabase
//       .from("events")
//       .select("*")
//       .eq("created_by", userId)
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     res.json({ success: true, events: data });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

// /* =====================================================
//    ✅ GET SINGLE EVENT
// ===================================================== */
// router.get("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { data, error } = await supabase
//       .from("events")
//       .select("*")
//       .eq("id", id)
//       .single();

//     if (error) throw error;

//     res.json({ success: true, event: data });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

// module.exports = router;








































const express = require("express");
const multer = require("multer");
const router = express.Router();
const supabase = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware");

// track whether our registrations table has a `confirm` column; we'll lazily
// check the schema on first use and cache the result so we can survive a
// database that hasn't been migrated yet.
let hasConfirmColumn = null;
async function ensureConfirmColumn() {
  if (hasConfirmColumn !== null) return hasConfirmColumn;
  try {
    const { error } = await supabase
      .from("registrations")
      .select("confirm")
      .limit(1);
    if (error) {
      // most likely message will mention 'confirm' missing
      console.warn("confirm column check error", error.message);
      hasConfirmColumn = false;
    } else {
      hasConfirmColumn = true;
    }
  } catch (err) {
    console.warn("confirm column detection failed", err.message);
    hasConfirmColumn = false;
  }
  return hasConfirmColumn;
}

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* =====================================================
   ✅ CREATE EVENT (PROTECTED)
===================================================== */
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "card", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        eventname,
        description,
        hostname,
        eventdate,
        email,
        country,
        address,
        city,
        state,
        postal,
        audience,
        type,
        attendees,
        price,
        tech,
        agenda,
        twitter,
        website,
        linkedin,
        instagram,
      } = req.body;

      const approval = req.body.approval === "true";
      const sponsors = JSON.parse(req.body.sponsors || "[]");

      let banner_url = null;
      let card_url = null;

      /* ========= Upload Banner ========= */
      if (req.files?.banner?.length) {
        const file = req.files.banner[0];
        const fileName = `banner_${Date.now()}_${file.originalname}`;

        const { error } = await supabase.storage
          .from("events")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        banner_url = supabase.storage
          .from("events")
          .getPublicUrl(fileName).data.publicUrl;
      }

      /* ========= Upload Card ========= */
      if (req.files?.card?.length) {
        const file = req.files.card[0];
        const fileName = `card_${Date.now()}_${file.originalname}`;

        const { error } = await supabase.storage
          .from("events")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        card_url = supabase.storage
          .from("events")
          .getPublicUrl(fileName).data.publicUrl;
      }

      /* ========= Insert Into DB ========= */
      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            eventname,
            description,
            hostname,
            eventdate,
            email,
            country,
            address,
            city,
            state,
            postal,
            audience,
            type,
            attendees: attendees ? parseInt(attendees) : null,
            price: price ? parseFloat(price) : null,
            tech,
            agenda,
            twitter,
            website,
            linkedin,
            instagram,
            approval,
            sponsors,
            banner_url,
            card_url,
            created_by: req.user.id, // 🔐 SECURE
          },
        ])
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, event: data });
    } catch (err) {
      console.error("CREATE ERROR:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =====================================================
   ✅ GET ALL EVENTS (PUBLIC)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, events: data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =====================================================
   ✅ GET MY EVENTS (PROTECTED)
===================================================== */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, events: data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =====================================================
   ✅ GET EVENT + REGISTRATIONS (PROTECTED)
===================================================== */
// router.get("/:id/registrations", authMiddleware, async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Registrations for this event
//     const { data: regs, error: regError } = await supabase
//       .from("registrations")
//       .select("*")
//       .eq("event_id", id);

//     if (regError) throw regError;

//     // Event info
//     const { data: event, error: eventError } = await supabase
//       .from("events")
//       .select("*")
//       .eq("id", id)
//       .single();

//     if (eventError) throw eventError;

//     res.json({
//       success: true,
//       registrations: regs || [],
//       event: event || null,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });




// registrations route
router.get("/:id/registrations", async (req, res) => {
  try {
    const { id } = req.params;

    // Check schema once and build select string accordingly to avoid noisy retries
    const hasConfirm = await ensureConfirmColumn();
    const selectStr = hasConfirm
      ? "id, confirm, user_id, users(firstname,lastname,email)"
      : "id, user_id, users(firstname,lastname,email)";

    const { data, error } = await supabase
      .from("registrations")
      .select(selectStr)
      .eq("event_id", id);

    if (error) {
      // If we unexpectedly hit a schema error, try a minimal fallback once
      if (error.message?.includes("confirm")) {
        console.log("⚠️  confirm column doesn't exist (unexpected), retrying without it");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("registrations")
          .select("id, user_id, users(firstname,lastname,email)")
          .eq("event_id", id);
        if (fallbackError) return res.status(500).json({ success: false, error: fallbackError.message });
        return res.json({ success: true, registrations: fallbackData, event: null });
      }
      return res.status(500).json({ success: false, error: error.message });
    }

    // debug: log what we selected so we can see why client shows empty table
    try {
      console.log("REGISTRATIONS FETCH", { eventId: id, select: selectStr, count: Array.isArray(data) ? data.length : 0 });
      if (Array.isArray(data) && data.length) console.log("REGISTRATIONS DATA SAMPLE", data.slice(0, 5));
    } catch (logErr) {
      console.warn("Failed to log registrations data", logErr);
    }

    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    res.json({ success: true, registrations: data, event: eventData });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});




/* =====================================================
   ✅ REGISTER USER FOR EVENT (PUBLIC)
===================================================== */
router.post("/:id/register", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log("REGISTER route hit", { eventId: id, userId });

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // ensure the event actually exists before touching registrations
    const { data: eventRecord, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (eventErr) throw eventErr;
    if (!eventRecord) {
      return res.status(404).json({ error: "Event not found" });
    }

    // optionally verify user exists (helpful if token stale)
    const { data: userRecord, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user already registered
    const { data: existingReg, error: checkError } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingReg) {
      return res.status(400).json({ error: "You are already registered for this event" });
    }

    // Insert registration (only include confirm column if it exists)
    const insertObj = { event_id: id, user_id: userId };
    if (await ensureConfirmColumn()) {
      insertObj.confirm = "pending";
    }

    const { data, error } = await supabase
      .from("registrations")
      .insert([insertObj])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, registration: data });
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);
    // if Supabase gives a human message include it in response
    const msg = err?.message || err?.error_description || "Registration failed";
    // if it's the schema cache error remove confirm and retry one more time
    if (msg.includes("could not find the 'confirm'")) {
      try {
        const { data, error } = await supabase
          .from("registrations")
          .insert([{ event_id: id, user_id: userId }])
          .select()
          .single();
        if (!error) {
          return res.json({ success: true, registration: data });
        }
      } catch (_) {}
    }
    res.status(500).json({
      success: false,
      message: msg,
    });
  }
});

/* =====================================================
   ✅ GET SINGLE EVENT (PUBLIC)
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      // no such event – send 404 so front‑end can react accordingly
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.json({ success: true, event: data });
  } catch (err) {
    console.error("GET EVENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;