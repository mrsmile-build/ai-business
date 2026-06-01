require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Health check
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "AI Business SaaS Backend Running"
  });
});

// CREATE LEAD (STORE IN SUPABASE)
app.post("/api/lead", async (req, res) => {
  try {
    const { name, phone, message, user_id } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          phone,
          message,
          user_id,
        }
      ])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      lead: data[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET ALL LEADS (FROM SUPABASE)
app.get("/api/leads", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      leads: data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// GET LEADS FOR ONE USER
app.get("/api/leads/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user_id)
      .order("id", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      leads: data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("AI Business Server running on port " + PORT);
});

app.post("/api/ai-reply", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY_1}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a helpful business assistant that replies to customer messages professionally."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      reply: data.choices?.[0]?.message?.content || "No response from AI"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

