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

/* ---------------- PLAN LIMITS ---------------- */
const PLANS = {
  free:     { leads: 10,       ai_per_day: 3,        label: "Free",     price: 0 },
  starter:  { leads: 50,       ai_per_day: 15,       label: "Starter",  price: 6000 },
  pro:      { leads: 500,      ai_per_day: 50,       label: "Pro",      price: 15000 },
  business: { leads: Infinity, ai_per_day: Infinity, label: "Business", price: 45000 }
};

/* ---------------- AUTH MIDDLEWARE ---------------- */
async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Invalid token" });
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
  if(data){
    const today = new Date().toDateString();
    if(data.usage_date !== today){
      await supabase.from("subscriptions")
        .update({ ai_usage: 0, usage_date: today })
        .eq("user_id", user.id);
      return { ...data, ai_usage: 0, usage_date: today };
    }
  }
  return data || { user_id: user.id, plan: "free", ai_usage: 0, status: "free" };
}

/* ---------------- ME ---------------- */
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const sub = await getSubscription(req.user);
    const limits = PLANS[sub.plan] || PLANS.free;
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id);
    res.json({
      success: true,
      user: { id: req.user.id, email: req.user.email },
      subscription: { ...sub, limits, leads_count: count || 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- LEADS GET ---------------- */
app.get("/api/leads", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, leads: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- LEADS POST ---------------- */
app.post("/api/leads", authMiddleware, async (req, res) => {
  try {
    const sub = await getSubscription(req.user);
    const limits = PLANS[sub.plan] || PLANS.free;
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id);
    if (limits.leads !== Infinity && count >= limits.leads) {
      return res.json({ success: false, error: "Lead limit reached. Upgrade your plan." });
    }
    const { name, phone, email, business, message } = req.body;
    const { data, error } = await supabase
      .from("leads")
      .insert({ user_id: req.user.id, name, phone, email, business, message })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, lead: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- LEADS DELETE ---------------- */
app.delete("/api/leads/:id", authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- AI REPLY ---------------- */
app.post("/api/ai-reply", authMiddleware, async (req, res) => {
  try {
    const sub = await getSubscription(req.user);
    const limits = PLANS[sub.plan] || PLANS.free;
    const usage = sub.ai_usage || 0;
    if (limits.ai_per_day !== Infinity && usage >= limits.ai_per_day) {
      return res.json({ success: false, reply: "Daily AI limit reached. Upgrade your plan." });
    }
    await supabase.from("subscriptions").update({ ai_usage: usage + 1 }).eq("user_id", req.user.id);
    const { message, tool, history } = req.body;
    const systemPrompts = {
      idea: "You are a business consultant for Nigerian/African entrepreneurs. Give specific, practical business ideas with estimated costs in Naira. Format responses as numbered items.",
      ad: "You are an expert copywriter for the Nigerian/African market. Write compelling ad copy that resonates with local culture. Format multiple options as numbered items.",
      sales: "You are a sales expert for Nigerian market. Write persuasive WhatsApp/SMS messages that feel personal. Format multiple options as numbered items.",
      content: "You are a social media expert for Nigerian/African brands. Create engaging posts with captions and hashtags. Format as numbered items.",
      email: "You are an email marketing expert for Nigerian businesses. Write professional emails that convert. Format multiple options as numbered items."
    };
    const systemMsg = systemPrompts[tool] || "You are a smart business assistant helping Nigerian entrepreneurs grow. Be practical and direct. Format lists as numbered items.";
    const messages = [
      { role: "system", content: systemMsg },
      ...((history || []).slice(-6)),
      { role: "user", content: message }
    ];
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY_1 },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages })
    });
    const data = await response.json();
    res.json({ success: true, reply: data.choices?.[0]?.message?.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- PAYSTACK INIT ---------------- */
app.post("/api/paystack/init", authMiddleware, async (req, res) => {
  try {
    const { email, plan } = req.body;
    const planData = PLANS[plan];
    if (!planData || planData.price === 0) return res.status(400).json({ error: "Invalid plan" });
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        email, amount: planData.price * 100,
        metadata: { plan },
        callback_url: process.env.BASE_URL + "/api/paystack/verify"
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- PAYSTACK VERIFY ---------------- */
app.get("/api/paystack/verify", async (req, res) => {
  try {
    const { reference } = req.query;
    const response = await fetch("https://api.paystack.co/transaction/verify/" + reference, {
      headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY }
    });
    const data = await response.json();
    if (data?.data?.status === "success") {
      const email = data.data.customer.email;
      const amount = data.data.amount / 100;
      const plan = amount >= 45000 ? "business" : "pro";
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);
      if (user) {
        await supabase.from("subscriptions").upsert({
          user_id: user.id, email, plan, status: "active",
          ai_usage: 0, amount_paid: amount, last_payment_date: new Date()
        });
      }
      return res.redirect("/dashboard?payment=success");
    }
    res.redirect("/dashboard?payment=failed");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* ---------------- REFRESH TOKEN ---------------- */
app.post("/api/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if(error) return res.status(401).json({ error: "Session expired" });
    res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- DELETE ACCOUNT ---------------- */
app.delete("/api/account", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    await supabase.from("leads").delete().eq("user_id", uid);
    await supabase.from("subscriptions").delete().eq("user_id", uid);
    const { error } = await supabase.auth.admin.deleteUser(uid);
    if(error) throw error;
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- STATUS ---------------- */
app.get("/api/status", (req, res) => {
  res.json({ success: true, message: "AI Business SaaS Running" });
});

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("AI SaaS running on port " + PORT));
