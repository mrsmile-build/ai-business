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

/* ---------------- LEADS UPDATE ---------------- */
app.patch("/api/leads/:id", authMiddleware, async (req, res) => {
  try {
    const { status, notes, name, phone, email, business, follow_up_date, sale_amount } = req.body;
    const updates = {};
    if(status !== undefined) updates.status = status;
    if(notes !== undefined) updates.notes = notes;
    if(name !== undefined) updates.name = name;
    if(phone !== undefined) updates.phone = phone;
    if(email !== undefined) updates.email = email;
    if(business !== undefined) updates.business = business;
    if(follow_up_date !== undefined) updates.follow_up_date = follow_up_date;
    if(sale_amount !== undefined) updates.sale_amount = sale_amount;
    updates.updated_at = new Date();
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select().single();
    if(error) throw error;
    res.json({ success: true, lead: data });
  } catch(err) { res.status(500).json({ error: err.message }); }
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

/* ---------------- PROFILE ---------------- */
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", req.user.id).single();
    res.json({ success: true, profile: data || {} });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/profile", authMiddleware, async (req, res) => {
  try {
    const { display_name, avatar_url, phone, country } = req.body;
    const updates = { user_id: req.user.id };
    if(phone !== undefined) updates.phone = phone;
    if(country !== undefined) updates.country = country;
    if(avatar_url !== undefined) updates.avatar_url = avatar_url;
    if(display_name !== undefined){
      const { data: existing } = await supabase.from("profiles").select("username_updated_at").eq("user_id", req.user.id).single();
      if(existing?.username_updated_at){
        const days = (Date.now() - new Date(existing.username_updated_at).getTime())/(1000*60*60*24);
        if(days < 30) return res.json({ success: false, error: "Username can only be changed every 30 days. "+Math.ceil(30-days)+" days remaining." });
      }
      updates.display_name = display_name;
      updates.username_updated_at = new Date();
    }
    const { data, error } = await supabase.from("profiles").upsert(updates, { onConflict: "user_id" }).select().single();
    if(error) throw error;
    res.json({ success: true, profile: data });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/change-password", authMiddleware, async (req, res) => {
  try {
    const { current_password, password } = req.body;
    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: current_password
    });
    if(signInError) return res.json({ success: false, error: "Current password is incorrect." });
    // Change password
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password });
    if(error) throw error;
    res.json({ success: true });
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

/* ---------------- LEAD FINDER ---------------- */
app.post("/api/lead-finder", authMiddleware, async (req, res) => {
  try {
    const sub = await getSubscription(req.user);
    const plan = sub.plan || "free";
    const limits = { free: 3, starter: 15, pro: 50, business: 999 };
    const monthlyLimit = limits[plan] || 3;

    // Monthly reset
    const thisMonth = new Date().toISOString().slice(0, 7);
    let usage = sub.lead_finder_usage || 0;
    if(sub.lead_finder_reset_date !== thisMonth){
      usage = 0;
      await supabase.from("subscriptions")
        .update({ lead_finder_usage: 0, lead_finder_reset_date: thisMonth })
        .eq("user_id", req.user.id);
    }

    if(usage >= monthlyLimit){
      return res.json({ success: false, error: `Monthly limit reached (${monthlyLimit} searches). Upgrade your plan.`, usage, limit: monthlyLimit });
    }

    const { service, location, context } = req.body;
    if(!service || !location) return res.status(400).json({ error: "Service and location required" });

    // Search HasData
    const searchQuery = (req.body.industry && req.body.industry !== req.body.service) ? req.body.industry + " " + location : service + " " + location;
    const searchRes = await fetch(
      `https://api.hasdata.com/scrape/google/serp?q=${encodeURIComponent(searchQuery)}&gl=ng&hl=en`,
      { headers: { "x-api-key": process.env.HASDATA_KEY } }
    );
    const searchData = await searchRes.json();

    // Extract local leads (have phone numbers — gold)
    const localLeads = (searchData.localResults?.places || []).slice(0, 8).map(p => ({
      name: p.title, phone: p.phone||null, address: p.address||null,
      website: p.links?.website||null, rating: p.rating||null,
      reviews: p.reviews||null, type: p.type||null, source: "local"
    }));

    // Extract organic leads (websites)
    const skipDomains = ["upwork","jiji","instagram","facebook","linkedin","youtube"];
    const organicLeads = (searchData.organicResults || [])
      .filter(r => !skipDomains.some(d => r.link.includes(d)))
      .slice(0, 5).map(r => ({
        name: r.source||r.title, phone: null, website: r.link,
        snippet: r.snippet?.slice(0,100), source: "organic"
      }));

    const allLeads = [...localLeads, ...organicLeads].slice(0, 10);

    // Generate AI messages for all leads at once
    const userOffer = context || service;
    const prompt = `You help Nigerian entrepreneurs reach potential clients via WhatsApp.
The entrepreneur offers: ${userOffer} in ${location}.

Write a short friendly WhatsApp outreach message for each business below.
- Under 80 words each
- Mention the business name
- Focus on value, not selling
- End with a clear question

Businesses:
${allLeads.map((l,i) => `${i+1}. ${l.name}${l.type ? " ("+l.type+")" : ""}${l.snippet ? " - "+l.snippet : ""}`).join("\n")}

Return ONLY a JSON array of strings in the same order. No markdown, no explanation.`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY_1 },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
    });
    const groqData = await groqRes.json();
    let messages = [];
    try {
      const raw = groqData.choices[0].message.content.replace(/```json|```/g,"").trim();
      messages = JSON.parse(raw);
    } catch(e) {
      messages = allLeads.map(l => `Hi ${l.name}, I offer ${userOffer} and would love to help your business grow. Can we talk?`);
    }

    const leads = allLeads.map((l,i) => ({
      ...l,
      message: messages[i] || `Hi ${l.name}, I offer ${userOffer} and would love to connect.`
    }));

    await supabase.from("subscriptions")
      .update({ lead_finder_usage: usage + 1 })
      .eq("user_id", req.user.id);

    res.json({ success: true, leads, usage: usage + 1, limit: monthlyLimit });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- FOLLOW-UP ALERTS ---------------- */
app.get("/api/leads/followups", authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("leads").select("*")
      .eq("user_id", req.user.id)
      .lte("follow_up_date", today)
      .not("follow_up_date", "is", null)
      .not("status", "in", '("won","lost")')
      .order("follow_up_date", { ascending: true });
    res.json({ success: true, followups: data || [] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- REVENUE SUMMARY ---------------- */
app.get("/api/revenue", authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase
      .from("leads").select("sale_amount, created_at, status, name")
      .eq("user_id", req.user.id)
      .eq("status", "won");
    const total = (data||[]).reduce((sum, l) => sum + (parseFloat(l.sale_amount)||0), 0);
    const thisMonth = new Date().toISOString().slice(0,7);
    const monthly = (data||[])
      .filter(l => l.created_at?.startsWith(thisMonth))
      .reduce((sum, l) => sum + (parseFloat(l.sale_amount)||0), 0);
    res.json({ success: true, total, monthly, count: (data||[]).length, deals: data||[] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- PROPOSAL GENERATOR ---------------- */
app.post("/api/generate-proposal", authMiddleware, async (req, res) => {
  try {
    const { client_name, service, price, details, your_name, your_business } = req.body;
    const prompt = `You are a professional business proposal writer for Nigerian entrepreneurs.

Write a complete, professional business proposal with these details:
- From: ${your_name || "AI Business User"} / ${your_business || "Our Company"}
- To: ${client_name}
- Service: ${service}
- Price: ${price || "To be discussed"}
- Details: ${details || "Standard service delivery"}

Write a complete proposal with these sections:
1. Cover/Header
2. Executive Summary (2-3 sentences)
3. Understanding Your Needs (what problem they have)
4. Our Proposed Solution (what we will do)
5. Deliverables (bullet list of exactly what they get)
6. Timeline (realistic timeline)
7. Investment (price breakdown)
8. Why Choose Us (2-3 points)
9. Next Steps
10. Terms & Validity (valid 30 days)

Make it professional, persuasive, and specific to Nigerian business context.
Format with clear sections using headers. Be detailed but concise.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY_1 },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
    });
    const data = await response.json();
    const proposal = data.choices?.[0]?.message?.content;
    res.json({ success: true, proposal });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- REFERRAL ---------------- */
app.get("/api/referral", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    let { data: profile } = await supabase.from("profiles").select("*").eq("user_id", uid).single();
    
    // Generate code if missing
    if(!profile?.referral_code) {
      const code = "aib-" + uid.substring(0,8);
      await supabase.from("profiles").upsert({ user_id: uid, referral_code: code });
      if(profile) profile.referral_code = code;
      else profile = { referral_code: code };
    }
    
    // Get referrals
    const { data: refs } = await supabase.from("referrals")
      .select("*").eq("referrer_id", uid).order("created_at", { ascending: false });
    
    const list = refs || [];
    const starters = list.filter(r => r.referred_plan === "starter" && !r.redeemed).length;
    const pros = list.filter(r => r.referred_plan === "pro" && !r.redeemed).length;
    const businesses = list.filter(r => r.referred_plan === "business" && !r.redeemed).length;
    
    // Calculate reward
    let reward = null;
    if(pros >= 5 || businesses >= 3) reward = "pro";
    else if(starters >= 5 || pros >= 3) reward = "starter";
    
    res.json({ success: true, code: profile.referral_code, referrals: list, reward, stats: { starters, pros, businesses, total: list.length } });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/referral/track", async (req, res) => {
  try {
    const { referral_code, email } = req.body;
    if(!referral_code || !email) return res.json({ success: false });
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("referral_code", referral_code).single();
    if(!profile) return res.json({ success: false, error: "Invalid referral code" });
    await supabase.from("referrals").upsert({ referrer_id: profile.user_id, referred_email: email, status: "registered" });
    res.json({ success: true });
  } catch(err) { res.json({ success: false }); }
});

app.post("/api/referral/redeem", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const { data: refs } = await supabase.from("referrals").select("*").eq("referrer_id", uid).eq("redeemed", false);
    const list = refs || [];
    const pros = list.filter(r => r.referred_plan === "pro" || r.referred_plan === "business").length;
    const starters = list.filter(r => r.referred_plan === "starter").length;
    
    let plan = null;
    if(pros >= 5) plan = "pro";
    else if(starters >= 5 || pros >= 3) plan = "starter";
    
    if(!plan) return res.json({ success: false, error: "Not enough referrals to redeem yet." });
    
    // Mark all as redeemed
    await supabase.from("referrals").update({ redeemed: true }).eq("referrer_id", uid).eq("redeemed", false);
    
    // Upgrade subscription temporarily
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    await supabase.from("subscriptions").upsert({ user_id: uid, plan, status: "referral", ai_usage: 0, last_payment_date: new Date() });
    
    res.json({ success: true, plan, message: "You earned 1 free month of " + plan + " plan!" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- AUTOMATION ---------------- */
app.get("/api/automation/settings", authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase.from("automation_settings").select("*").eq("user_id", req.user.id).single();
    res.json({ success: true, settings: data || {} });
  } catch(err) { res.json({ success: true, settings: {} }); }
});

app.post("/api/automation/settings", authMiddleware, async (req, res) => {
  try {
    const settings = { ...req.body, user_id: req.user.id, updated_at: new Date() };
    await supabase.from("automation_settings").upsert(settings);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/campaigns", authMiddleware, async (req, res) => {
  try {
    const { name, message_template, target_status, scheduled_time } = req.body;
    const { data } = await supabase.from("campaigns").insert({
      user_id: req.user.id, name, message_template, target_status,
      scheduled_time: scheduled_time || new Date(), status: "pending"
    }).select().single();
    res.json({ success: true, campaign: data });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/campaigns", authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase.from("campaigns").select("*")
      .eq("user_id", req.user.id).order("created_at", { ascending: false });
    res.json({ success: true, campaigns: data || [] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/campaigns/:id/prepare", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).eq("user_id", req.user.id).single();
    if(!campaign) return res.status(404).json({ error: "Not found" });

    // Get target leads
    let query = supabase.from("leads").select("*").eq("user_id", req.user.id);
    if(campaign.target_status !== "all") query = query.eq("status", campaign.target_status);
    const { data: leads } = await query;

    if(!leads || leads.length === 0) return res.json({ success: true, messages: [] });

    // Generate personalized messages using AI
    const prompt = `You are personalizing a WhatsApp message template for different contacts.
Template: "${campaign.message_template}"

Personalize this for each contact below. Keep the core message but add their name naturally.
Contacts: ${leads.map((l,i) => `${i+1}. ${l.name}${l.business ? " ("+l.business+")" : ""}`).join(", ")}

Return ONLY a JSON array of personalized messages in same order. No markdown.`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY_1 },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
    });
    const groqData = await groqRes.json();
    let messages = [];
    try {
      const raw = groqData.choices[0].message.content.replace(/```json|```/g,"").trim();
      messages = JSON.parse(raw);
    } catch(e) {
      messages = leads.map(l => campaign.message_template.replace("{name}", l.name));
    }

    const prepared = leads.map((l, i) => ({
      lead_id: l.id, name: l.name, phone: l.phone,
      message: messages[i] || campaign.message_template
    }));

    await supabase.from("campaigns").update({ status: "ready" }).eq("id", id);
    res.json({ success: true, messages: prepared, count: prepared.length });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    await supabase.from("campaigns").delete().eq("id", req.params.id).eq("user_id", req.user.id);
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
