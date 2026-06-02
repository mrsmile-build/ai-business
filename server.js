require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ---------------- AUTH ---------------- */
async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- GET SUBSCRIPTION ---------------- */
async function getSubscription(user) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data || {
    user_id: user.id,
    plan: "free",
    ai_usage: 0,
    status: "free"
  };
}

/* ---------------- AI REPLY ---------------- */
app.post("/api/ai-reply", authMiddleware, async (req, res) => {
  try {
    const sub = await getSubscription(req.user);

    const plan = sub.plan;
    const usage = sub.ai_usage || 0;

    if (plan === "free" && usage >= 5) {
      return res.json({
        success: false,
        reply: "🚫 Free limit reached. Upgrade to Pro."
      });
    }

    await supabase
      .from("subscriptions")
      .update({ ai_usage: usage + 1 })
      .eq("user_id", req.user.id);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY_1}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a business assistant." },
          { role: "user", content: req.body.message }
        ]
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      reply: data.choices?.[0]?.message?.content
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- PAYSTACK INIT ---------------- */
app.post("/api/paystack/init", authMiddleware, async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        callback_url: `${process.env.BASE_URL}/api/paystack/verify`
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- PAYSTACK VERIFY ---------------- */
      }
    }

    res.redirect(`${process.env.BASE_URL}/dashboard`);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;
  console.log("AI SaaS running on port " + PORT);
});

/* ---------------- USER STATE (MASTER API) ---------------- */
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      subscription: data || {
        plan: "free",
        ai_usage: 0,
        status: "free"
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- PAYSTACK AUTO UPGRADE ---------------- */
      }

      return res.redirect("/dashboard?payment=success");
    }

    res.redirect("/dashboard?payment=failed");

  } catch (err) {
    res.status(500).send(err.message);
  }
});


/* ---------------- PAYSTACK VERIFY CLEAN ---------------- */
      }
    }

    return res.redirect(`${process.env.BASE_URL}/dashboard`);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("AI SaaS running on port " + PORT);
});


/* ---------------- PAYSTACK VERIFY (CLEAN FINAL) ---------------- */
app.get("/api/paystack/verify", async (req, res) => {
  try {
    const { reference } = req.query;

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = await response.json();

    if (data?.data?.status === "success") {
      const email = data.data.customer.email;

      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);

      if (user) {
        await supabase.from("subscriptions").upsert({
          user_id: user.id,
          email,
          plan: "pro",
          status: "active",
          ai_usage: 0,
          amount_paid: data.data.amount / 100,
          last_payment_date: new Date()
        });
      }
    }

    return res.redirect(`${process.env.BASE_URL}/dashboard`);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

