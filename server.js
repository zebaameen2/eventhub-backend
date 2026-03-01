require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("./supabaseClient");


const authMiddleware = require("./middleware/authMiddleware");

const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const registrationsRoutes = require("./routes/registrations");

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// ===== Root Route =====
// app.get("/", (req, res) => {
//   res.json({ message: `Supabase backend running at ${import.meta.env.VITE_BASE_URL}` });
// });

app.get("/", (req, res) => { res.json({ message: `Supabase backend running at ${process.env.VITE_BASE_URL}` }); });

// ===== Routes =====
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationsRoutes);

// Dev/local email endpoint to avoid relying on external service during development.
// Accepts { email, subject, message } and logs the payload. Returns 200.
app.post("/api/send-email", (req, res) => {
  try {
    const { email, subject, message } = req.body || {};
    console.log("DEV EMAIL REQUEST", { email, subject, message });
    // In production replace with actual email send using SendGrid/SMTP and proper API key.
    return res.json({ success: true, message: "Email logged (dev)" });
  } catch (err) {
    console.error("DEV EMAIL ERROR", err);
    return res.status(500).json({ success: false, message: "Email failed (dev)" });
  }
});


// ================= SIGNUP =================
app.post("/api/signup", async (req, res) => {
  try {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check existing email
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();   // ✅ better than single()

    if (selectError) {
      return res.status(500).json({ error: selectError.message });
    }

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{
        firstname,
        lastname,
        email,
        password_hash,
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: data.id,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
      },
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// app.post("/api/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const { data: user, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("email", email)
//       .maybeSingle();

//     if (error || !user) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password_hash);
//     if (!isMatch) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     res.status(200).json({
//       message: "Login successful",
//       user: {
//         id: user.id,
//         firstname: user.firstname,
//         lastname: user.lastname,
//         email: user.email,
//       },
//     });

//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });
// *********LOGIN ROUTE*******

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error || !user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // ✅ JWT Token create karo
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Token return karo
    res.status(200).json({
      message: "Login successful",
      token,   // 🔥 THIS IS IMPORTANT
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ================= GET EVENT BY ID =================
app.get("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ event: data });

  } catch (err) {
    console.error("Get event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});






// ================= VERIFY TOKEN ================= 


app.get("/api/verify", authMiddleware, (req, res) => { res.json({ valid: true }); });


// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Supabase backend running on PORT${PORT}`);
});