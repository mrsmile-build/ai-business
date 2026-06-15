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
        await creditAffiliate(user.id, plan).catch(function(){}); await supabase.from("subscriptions").upsert({
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

    // Combine local results from SERP + Maps for more phone numbers
    const serpLocal = (searchData.localResults?.places || []);
    const mapsLocal = [];
    const allLocal = [...serpLocal, ...mapsLocal];

    // Deduplicate by phone number
    const seenPhones = new Set();
    const seenNames = new Set();
    const deduped = allLocal.filter(p => {
      const phone = p.phone || p.phoneNumber || null;
      const name = (p.title || p.name || "").toLowerCase();
      if(phone && seenPhones.has(phone)) return false;
      if(seenNames.has(name)) return false;
      if(phone) seenPhones.add(phone);
      seenNames.add(name);
      return true;
    });

    const localLeads = deduped.slice(0, 10).map(p => ({
      name: p.title || p.name, 
      phone: p.phone || p.phoneNumber || null, 
      address: p.address || p.street || null,
      website: p.links?.website || p.website || null, 
      rating: p.rating || null,
      reviews: p.reviews || p.reviewsCount || null, 
      type: p.type || p.category || null, 
      source: "local"
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

/* ---------------- AGENT SETTINGS ---------------- */
app.get("/api/agent-settings", authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase.from("agent_settings").select("*").eq("user_id", req.user.id).single();
    res.json({ success: true, settings: data || {} });
  } catch(err) { res.json({ success: true, settings: {} }); }
});

app.post("/api/agent-settings", authMiddleware, async (req, res) => {
  try {
    const settings = { ...req.body, user_id: req.user.id, updated_at: new Date() };
    await supabase.from("agent_settings").upsert(settings);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/receptionist", authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    const { data: settings } = await supabase.from("agent_settings").select("*").eq("user_id", req.user.id).single();
    if(!settings || !settings.business_name) return res.json({ success: false, error: "Please setup your Receptionist first." });

    const prompt = `You are the AI receptionist for ${settings.business_name}.

Business Info:
- Description: ${settings.business_description || "Not specified"}
- Services: ${settings.services || "Not specified"}
- Prices: ${settings.prices || "Not specified"}
- Opening Hours: ${settings.opening_hours || "Not specified"}
- Location: ${settings.location || "Not specified"}
- WhatsApp: ${settings.whatsapp || "Not specified"}
- Booking: ${settings.booking_info || "Not specified"}
- Extra Info: ${settings.extra_info || ""}

A customer asked: "${question}"

Reply professionally, helpfully, and friendly. Keep it under 100 words. If asked about something not in the info above, say you will let the team know and they will respond shortly.`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY_1 },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 200 })
    });
    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Thank you for your message. Our team will respond shortly.";
    res.json({ success: true, reply });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- FEEDBACK ---------------- */
app.post("/api/feedback", authMiddleware, async (req, res) => {
  try {
    const { rating, message } = req.body;
    await supabase.from("feedback").insert({ user_id: req.user.id, rating, message });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- CHAT WIDGET (public) ---------------- */
app.post("/api/widget/chat", async (req, res) => {
  try {
    const { user_id, question, visitor_name, visitor_phone } = req.body;
    if(!user_id || !question) return res.status(400).json({ error: "Missing fields" });

    const { data: settings } = await supabase.from("agent_settings").select("*").eq("user_id", user_id).single();
    if(!settings) return res.json({ reply: "Thank you for your message. We will get back to you shortly." });

    // Save as lead automatically
    if(visitor_name || visitor_phone){
      await supabase.from("leads").insert({
        user_id, name: visitor_name || "Website Visitor",
        phone: visitor_phone || null,
        message: question, status: "new",
        business: "Website Enquiry"
      }).catch(()=>{});
    }

    const prompt = `You are the AI receptionist for ${settings.business_name}.
Services: ${settings.services || "Various services"}
Prices: ${settings.prices || "Contact us"}
Hours: ${settings.opening_hours || "Contact us"}
Location: ${settings.location || "Contact us"}
Customer asked: "${question}"
Reply helpfully in under 80 words.`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY_1 },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 150 })
    });
    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Thank you! We will respond shortly.";
    res.json({ success: true, reply });
  } catch(err) { res.status(500).json({ reply: "Thank you for your message. We will get back to you shortly." }); }
});

/* ---------------- SERVICES / BOOKING ---------------- */
app.get("/api/services", authMiddleware, async (req, res) => {
  const { data } = await supabase.from("services").select("*").eq("user_id", req.user.id).eq("is_active", true);
  res.json({ success: true, services: data || [] });
});

app.post("/api/services", authMiddleware, async (req, res) => {
  try {
    const { name, duration_minutes, price, description } = req.body;
    const { data } = await supabase.from("services").insert({ user_id: req.user.id, name, duration_minutes, price, description }).select().single();
    res.json({ success: true, service: data });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/services/:id", authMiddleware, async (req, res) => {
  await supabase.from("services").update({ is_active: false }).eq("id", req.params.id).eq("user_id", req.user.id);
  res.json({ success: true });
});

app.get("/api/bookings", authMiddleware, async (req, res) => {
  const { data } = await supabase.from("bookings").select("*, services(name, price, duration_minutes)")
    .eq("user_id", req.user.id).order("booking_date", { ascending: true });
  res.json({ success: true, bookings: data || [] });
});

app.patch("/api/bookings/:id", authMiddleware, async (req, res) => {
  const { status } = req.body;
  await supabase.from("bookings").update({ status }).eq("id", req.params.id).eq("user_id", req.user.id);
  res.json({ success: true });
});

// Public booking endpoint - no auth needed
app.get("/api/book/:userId/services", async (req, res) => {
  const { data } = await supabase.from("services").select("*").eq("user_id", req.params.userId).eq("is_active", true);
  const { data: biz } = await supabase.from("biz_pages").select("business_name, theme_color").eq("user_id", req.params.userId).single();
  res.json({ success: true, services: data || [], biz: biz || {} });
});

app.post("/api/book/:userId", async (req, res) => {
  try {
    const { service_id, customer_name, customer_phone, customer_email, booking_date, booking_time, notes } = req.body;
    const { data } = await supabase.from("bookings").insert({
      user_id: req.params.userId, service_id, customer_name,
      customer_phone, customer_email, booking_date, booking_time, notes, status: "pending"
    }).select("*, services(name, price)").single();
    res.json({ success: true, booking: data });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ---------------- BUSINESS PAGE ---------------- */
app.get("/api/biz-settings", authMiddleware, async (req, res) => {
  const { data } = await supabase.from("biz_pages").select("*").eq("user_id", req.user.id).single();
  res.json({ success: true, page: data || {} });
});

app.post("/api/biz-settings", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const slug = req.body.slug || uid.substring(0,8);
    const settings = { ...req.body, user_id: uid, slug, updated_at: new Date() };
    await supabase.from("biz_pages").upsert(settings);
    res.json({ success: true, slug });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// Public biz page
app.get("/biz/:slug", async (req, res) => {
  try {
    const { data: page } = await supabase.from("biz_pages").select("*, profiles!inner(user_id)").eq("slug", req.params.slug).single();
    if(!page) return res.status(404).send("Business page not found");
    const uid = page.user_id || page.profiles?.user_id;
    const { data: services } = await supabase.from("services").select("*").eq("user_id", uid).eq("is_active", true);
    const color = page.theme_color || "#3b82f6";
    const waLink = page.whatsapp ? "https://wa.me/" + page.whatsapp.replace(/[^0-9]/g,"").replace(/^0/,"234") : null;

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${page.business_name || "Business"}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#080c14;color:white;min-height:100vh}
.hero{background:linear-gradient(135deg,#0f172a,#1a2540);padding:40px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)}
.logo{width:80px;height:80px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;margin:0 auto 16px}
h1{font-size:26px;font-weight:800;margin-bottom:6px}
.tagline{color:#94a3b8;font-size:15px;margin-bottom:20px}
.cta{display:inline-block;padding:12px 28px;background:${color};color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin:6px}
section{padding:28px 20px;max-width:500px;margin:0 auto}
h2{font-size:16px;font-weight:700;margin-bottom:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
.service-card{background:#1e293b;border-radius:10px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
.service-name{font-size:14px;font-weight:600}
.service-detail{font-size:12px;color:#64748b;margin-top:2px}
.service-price{font-size:16px;font-weight:800;color:${color}}
.info-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #1e293b;font-size:14px}
.book-btn{display:block;text-align:center;padding:14px;background:${color};color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;margin-top:16px}
.footer{text-align:center;padding:20px;color:#334155;font-size:11px;border-top:1px solid #1e293b}
.footer a{color:#3b82f6;text-decoration:none}
</style>
</head>
<body>
<div class="hero">
  <div class="logo">${(page.business_name||"B").substring(0,2).toUpperCase()}</div>
  <h1>${page.business_name||""}</h1>
  <p class="tagline">${page.tagline||""}</p>
  ${waLink ? `<a href="${waLink}" class="cta">💬 WhatsApp Us</a>` : ""}
  <a href="/book/${uid}" class="cta" style="background:transparent;border:1px solid ${color};color:${color}">📅 Book Appointment</a>
</div>

${page.description ? `<section><h2>About Us</h2><p style="font-size:14px;color:#94a3b8;line-height:1.6">${page.description}</p></section>` : ""}

${services && services.length > 0 ? `
<section>
  <h2>Our Services</h2>
  ${services.map(s => `
    <div class="service-card">
      <div>
        <div class="service-name">${s.name}</div>
        <div class="service-detail">${s.duration_minutes} mins</div>
      </div>
      <div class="service-price">₦${parseFloat(s.price||0).toLocaleString()}</div>
    </div>
  `).join("")}
</section>` : ""}

<section>
  <h2>Find Us</h2>
  ${page.hours ? `<div class="info-item">🕐 <span>${page.hours}</span></div>` : ""}
  ${page.location ? `<div class="info-item">📍 <span>${page.location}</span></div>` : ""}
  ${page.whatsapp ? `<div class="info-item">📱 <span>${page.whatsapp}</span></div>` : ""}
  ${page.instagram ? `<div class="info-item">📸 <a href="${page.instagram}" style="color:#e1306c">Instagram</a></div>` : ""}
  <a href="/book/${uid}" class="book-btn">📅 Book an Appointment</a>
</section>

<div class="footer">Powered by <a href="${process.env.BASE_URL||"/"}">AI Business</a> — The AI Operating System for African Businesses</div>
</body>
</html>`);
  } catch(err) { res.status(500).send("Error loading page"); }
});

// Public booking page
app.get("/book/:userId", async (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Book Appointment</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#080c14;color:white;padding:20px;min-height:100vh}
.card{background:#1e293b;border-radius:14px;padding:20px;max-width:440px;margin:0 auto;border:1px solid rgba(255,255,255,0.05)}
h1{font-size:20px;font-weight:800;margin-bottom:6px;text-align:center}
p.sub{color:#64748b;font-size:13px;text-align:center;margin-bottom:20px}
label{font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;margin-top:10px}
input,select,textarea{width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px}
.btn{width:100%;padding:13px;background:#3b82f6;color:white;border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600;margin-top:16px}
.service-card{background:#0f172a;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;border:2px solid transparent;display:flex;justify-content:space-between;align-items:center}
.service-card.selected{border-color:#3b82f6}
#success{display:none;text-align:center;padding:20px}
</style>
</head>
<body>
<div class="card">
  <h1>📅 Book Appointment</h1>
  <p class="sub" id="biz_name">Loading...</p>

  <div id="booking_form">
    <label>Select Service</label>
    <div id="services_list"><p style="color:#64748b;font-size:13px">Loading services...</p></div>

    <label>Your Name *</label>
    <input id="b_name" placeholder="Full name">

    <label>Phone Number *</label>
    <input id="b_phone" placeholder="e.g. 08012345678" type="tel">

    <label>Email (optional)</label>
    <input id="b_email" placeholder="your@email.com" type="email">

    <label>Preferred Date *</label>
    <input id="b_date" type="date" min="${new Date().toISOString().split('T')[0]}">

    <label>Preferred Time *</label>
    <select id="b_time">
      ${["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(t=>`<option value="${t}">${t}</option>`).join("")}
    </select>

    <label>Additional Notes</label>
    <input id="b_notes" placeholder="Any special requests?">

    <button class="btn" onclick="submitBooking()">Confirm Booking</button>
  </div>

  <div id="success">
    <div style="font-size:48px;margin-bottom:12px">✅</div>
    <h2 style="margin-bottom:8px">Booking Confirmed!</h2>
    <p style="color:#64748b;font-size:14px">We will contact you shortly to confirm your appointment.</p>
  </div>
</div>

<script>
var uid = location.pathname.split("/book/")[1];
var selectedService = null;

fetch("/api/book/"+uid+"/services")
  .then(r=>r.json())
  .then(data=>{
    if(data.biz) document.getElementById("biz_name").textContent = data.biz.business_name || "Book your appointment";
    var list = document.getElementById("services_list");
    if(!data.services || !data.services.length){
      list.innerHTML = "<p style='color:#64748b;font-size:13px'>No services listed yet.</p>";
      return;
    }
    list.innerHTML = data.services.map(s=>
      "<div class='service-card' id='svc_"+s.id+"' onclick='selectService(""+s.id+"",this)'>"+
        "<div><div style='font-size:14px;font-weight:600'>"+s.name+"</div>"+
        "<div style='font-size:11px;color:#64748b'>"+s.duration_minutes+" mins</div></div>"+
        "<div style='font-size:16px;font-weight:800;color:#3b82f6'>₦"+parseFloat(s.price||0).toLocaleString()+"</div>"+
      "</div>"
    ).join("");
  });

function selectService(id, el){
  selectedService = id;
  document.querySelectorAll(".service-card").forEach(function(c){ c.classList.remove("selected"); });
  el.classList.add("selected");
}

async function submitBooking(){
  var name = document.getElementById("b_name").value.trim();
  var phone = document.getElementById("b_phone").value.trim();
  var date = document.getElementById("b_date").value;
  var time = document.getElementById("b_time").value;
  if(!name||!phone||!date||!time) return alert("Please fill all required fields.");
  if(!selectedService) return alert("Please select a service.");
  var btn = document.querySelector(".btn");
  btn.disabled=true; btn.textContent="Booking...";
  try {
    var res = await fetch("/api/book/"+uid,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({service_id:selectedService, customer_name:name, customer_phone:phone,
        customer_email:document.getElementById("b_email").value,
        booking_date:date, booking_time:time, notes:document.getElementById("b_notes").value})
    });
    var data = await res.json();
    if(data.success){
      document.getElementById("booking_form").style.display="none";
      document.getElementById("success").style.display="block";
    } else { alert("Booking failed. Try again."); btn.disabled=false; btn.textContent="Confirm Booking"; }
  } catch(e){ alert("Network error. Try again."); btn.disabled=false; btn.textContent="Confirm Booking"; }
}
</script>
</body>
</html>`);
});


/* ---------------- AFFILIATE ---------------- */
app.post("/api/affiliate/join", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const { data: existing, error: selErr } = await supabase.from("affiliates").select("*").eq("user_id", uid).single();
    if(existing) return res.json({ success: true, affiliate: existing });
    const code = "AFF-" + uid.substring(0,6).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase();
    const { data, error: insErr } = await supabase.from("affiliates").insert({ user_id: uid, affiliate_code: code }).select().single();
    if(insErr){ console.log("Affiliate insert error:", insErr.message); return res.status(500).json({ error: insErr.message }); }
    res.json({ success: true, affiliate: data });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/affiliate/stats", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const { data: aff } = await supabase.from("affiliates").select("*").eq("user_id", uid).single();
    if(!aff) return res.json({ success: false, error: "Not enrolled yet" });
    const { data: convs } = await supabase.from("affiliate_conversions").select("*").eq("affiliate_id", uid).order("created_at",{ascending:false});
    const { data: withdrawals } = await supabase.from("affiliate_withdrawals").select("*").eq("affiliate_id", uid).order("created_at",{ascending:false});
    res.json({ success: true, affiliate: aff, conversions: convs||[], withdrawals: withdrawals||[] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/affiliate/withdraw", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const { bank_name, account_number, account_name } = req.body;
    const { data: aff } = await supabase.from("affiliates").select("*").eq("user_id", uid).single();
    if(!aff) return res.json({ success: false, error: "Not an affiliate" });
    const balance = parseFloat(aff.balance||0);
    if(balance < 1000) return res.json({ success: false, error: "Minimum withdrawal is 1,000. Your balance: " + balance });
    await supabase.from("affiliate_withdrawals").insert({ affiliate_id: uid, amount: balance, bank_name, account_number, account_name, status: "pending" });
    await supabase.from("affiliates").update({ balance: 0 }).eq("user_id", uid);
    res.json({ success: true, message: "Withdrawal of " + balance.toLocaleString() + " submitted. Payment within 24-48 hours." });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/affiliate/track-signup", async (req, res) => {
  try {
    const { affiliate_code, user_id } = req.body;
    if(!affiliate_code || !user_id) return res.json({ success: false });
    const { data: aff } = await supabase.from("affiliates").select("user_id").eq("affiliate_code", affiliate_code).single();
    if(!aff || aff.user_id === user_id) return res.json({ success: false });
    await supabase.from("profiles").upsert({ user_id, referred_by_affiliate: affiliate_code });
    const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await supabase.from("subscriptions").upsert({ user_id, plan: "starter", status: "trial", is_trial: true, trial_ends_at: trialEnds, ai_usage: 0 });
    res.json({ success: true, trial: true, message: "7-day free trial activated!" });
  } catch(err) { res.json({ success: false }); }
});

/* ---------------- STATUS ---------------- */
app.get("/api/status", (req, res) => {
  res.json({ success: true, message: "AI Business SaaS Running" });
});

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("AI SaaS running on port " + PORT));
