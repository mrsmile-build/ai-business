const app = document.getElementById("app");

let currentUser = null;

/* =========================
   INIT USER
========================= */
async function init(){
  try {
    const res = await fetch("/api/me", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await res.json();
    currentUser = data.user;
    currentSub = data.subscription;
  } catch (e) {}

  loadPage("dashboard");
}

/* =========================
   CLEAN RENDER ENGINE
========================= */
function header(title, backPage){
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3>${title}</h3>
      <span onclick="loadPage('${backPage}')" style="cursor:pointer;font-size:14px">← Back</span>
    </div>
    <hr>
  `;
}
function setView(html){
  app.innerHTML = html;
}

/* =========================
   ROUTER
========================= */
function loadPage(page){
  closeMenu();

  const routes = {
    dashboard: renderDashboard,
    profile: renderProfile,
    analytics: renderAnalytics,
    leads: renderLeads,
    aiTools: renderAITools,
    subscription: renderSubscription,
    settings: renderSettings,
    support: renderSupport
  };

  (routes[page] || renderDashboard)();
}

/* =========================
   DASHBOARD (CORE SAAS)
========================= */
function renderDashboard(){
  setView(`
    <div class="card">
      <h2>📊 AI Business Control Center</h2>

      <div style="margin-top:15px">
        <p><strong>Email:</strong> ${currentUser?.email || "Loading..."}</p>
        <p><strong>Plan:</strong> Free</p>
        <p><strong>Total Leads:</strong> ${currentSub?.leads_count || 0}</p>
      </div>

      <div style="margin-top:20px">
        <button onclick="loadPage('leads')">📩 Leads</button>
        <button onclick="loadPage('aiTools')">🧠 AI Tools</button>
        <button onclick="loadPage('subscription')">💳 Upgrade</button>
      </div>
    </div>
  `);
}

/* =========================
   PROFILE
========================= */
function renderProfile(){
  setView(`
    <div class="card">
      ${header("👤 Profile","settings")}

      <p>Email: ${currentUser?.email || "Loading..."}</p>
      <p>Username: ${currentUser?.email?.split("@")[0] || ""}</p>
    </div>
  `);
}

/* =========================
   ANALYTICS
========================= */
function renderAnalytics(){
  setView(`
    <div class="card">
      ${header("📊 Analytics","dashboard")}
      <p>Coming soon...</p>
    </div>
  `);
}

/* =========================
   LEADS
========================= */
async function renderLeads(){
  setView(`<div class="card">${header("📩 Leads","dashboard")}<p>Loading...</p></div>`);
  try {
    const res = await fetch("/api/leads", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    const data = await res.json();
    const leads = data.leads || [];
    const limit = currentSub?.limits?.leads || 10;
    setView(`
      <div class="card">
        ${header("📩 Leads","dashboard")}
        <p style="font-size:13px;color:#94a3b8;margin-bottom:15px">${leads.length} / ${limit === Infinity ? "Unlimited" : limit} leads used</p>
        <div style="margin-bottom:15px">
          <input id="l_name" placeholder="Name *" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_phone" placeholder="Phone" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_email" placeholder="Email" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_business" placeholder="Business Type" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_message" placeholder="Notes" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <button onclick="addLead()" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:15px">+ Add Lead</button>
        </div>
        <div id="leads-list">
          ${leads.length === 0 ? '<p style="color:#94a3b8">No leads yet. Add your first one above.</p>' :
            leads.map(l => `
              <div style="background:#0f172a;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                <div>
                  <p style="margin:0;font-weight:bold">${l.name}</p>
                  <p style="margin:0;font-size:13px;color:#94a3b8">${l.phone || ""}${l.business ? " · " + l.business : ""}</p>
                  ${l.email ? `<p style="margin:0;font-size:12px;color:#64748b">${l.email}</p>` : ""}
                </div>
                <span onclick="deleteLead(${l.id})" style="color:#ef4444;cursor:pointer;font-size:22px">🗑</span>
              </div>
            `).join("")
          }
        </div>
      </div>
    `);
  } catch(e) {
    console.error("Leads error:", e);
    setView(`<div class="card">${header("📩 Leads","dashboard")}<p style="color:red">Error: ${e.message}</p></div>`);
  }
}

async function addLead(){
  const btn = document.querySelector("button[onclick='addLead()']");
  if(btn){ btn.disabled = true; btn.textContent = "Adding..."; }
  const name = document.getElementById("l_name")?.value.trim();
  if(!name) return alert("Name is required");
  const phone = document.getElementById("l_phone")?.value.trim();
  const email = document.getElementById("l_email")?.value.trim();
  const business = document.getElementById("l_business")?.value.trim();
  const message = document.getElementById("l_message")?.value.trim();
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify({ name, phone, email, business, message })
    });
    const data = await res.json();
    if(data.success){ renderLeads(); } else { alert(data.error || "Failed to add lead"); if(btn){ btn.disabled = false; btn.textContent = "+ Add Lead"; } }
  } catch(e){ alert("Error adding lead"); }
}

async function deleteLead(id){
  if(!confirm("Delete this lead?")) return;
  try {
    await fetch("/api/leads/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    renderLeads();
  } catch(e){ alert("Error deleting lead"); }
}

/* =========================
   AI TOOLS
========================= */
function renderAITools(){
  setView(`
    <div class="card">
      ${header("🧠 AI Tools","dashboard")}
      <p>This will become your MONEY engine</p>
    </div>
  `);
}

/* =========================
   SUBSCRIPTION
========================= */
async function renderSubscription(){
  const plan = currentSub?.plan || "free";
  const usage = currentSub?.ai_usage || 0;
  const leadsCount = currentSub?.leads_count || 0;
  const limits = currentSub?.limits || { leads: 10, ai_per_day: 3 };
  const colorMap = {business:"#8b5cf6",pro:"#3b82f6",starter:"#10b981",free:"#64748b"};
  const color = colorMap[plan] || "#64748b";

  let currency = "NGN", symbol = "₦", rate = 1;
  try {
    const geo = await fetch("https://ipapi.co/json/").then(r=>r.json());
    currency = geo.currency || "NGN";
    if(currency !== "NGN"){
      const fx = await fetch("https://api.frankfurter.app/latest?from=NGN&to="+currency).then(r=>r.json());
      rate = fx.rates?.[currency] || 1;
      const sym = {USD:"$",GBP:"£",EUR:"€",KES:"KSh",GHS:"₵",ZAR:"R",CAD:"C$",AUD:"A$"};
      symbol = sym[currency] || currency+" ";
    }
  } catch(e){}

  const fmt = (n) => currency==="NGN" ? "₦"+n.toLocaleString() : symbol+(n*rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,",");
  const allPlans = [
    {key:"starter",label:"🌟 Starter",color:"#10b981",leads:"50 leads",ai:"15 AI/day",price:6000,features:"Basic AI tools"},
    {key:"pro",label:"⭐ Pro",color:"#3b82f6",leads:"500 leads",ai:"50 AI/day",price:15000,features:"CSV export · Full AI tools"},
    {key:"business",label:"🚀 Business",color:"#8b5cf6",leads:"Unlimited",ai:"Unlimited AI",price:45000,features:"Team access · Weekly report"},
  ];
  const order = ["free","starter","pro","business"];
  const upgrades = allPlans.filter(p=>order.indexOf(p.key)>order.indexOf(plan));

  setView(`
    <div class="card">
      ${header("💳 Subscription","dashboard")}

      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:20px;border-left:4px solid ${color}">
        <p style="margin:0;font-size:12px;color:#94a3b8">Current Plan</p>
        <h3 style="margin:5px 0;color:${color}">${plan.toUpperCase()}</h3>
        <p style="margin:4px 0;font-size:13px">📩 Leads: ${leadsCount} / ${limits.leads === Infinity ? "Unlimited" : limits.leads}</p>
        <p style="margin:4px 0;font-size:13px">🧠 AI Uses: ${usage} / ${limits.ai_per_day === Infinity ? "Unlimited" : limits.ai_per_day} per day</p>
      </div>

      ${currency !== "NGN" ? `<p style="font-size:11px;color:#64748b;margin-bottom:10px">Prices shown in ${currency}</p>` : ""}
      ${upgrades.length > 0 ? upgrades.map(p => `
      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px;border:1px solid ${p.color}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h4 style="margin:0;color:${p.color}">${p.label}</h4>
            <p style="margin:4px 0;font-size:12px;color:#94a3b8">${p.leads} · ${p.ai}</p>
            <p style="margin:4px 0;font-size:12px;color:#94a3b8">${p.features}</p>
          </div>
          <div style="text-align:right">
            <p style="margin:0;font-weight:bold;color:white">${fmt(p.price)}</p>
            <p style="margin:0;font-size:11px;color:#94a3b8">/month</p>
          </div>
        </div>
        <button onclick="upgradePlan('${p.key}')" style="width:100%;margin-top:12px;padding:10px;background:${p.color};color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Upgrade to ${p.label}</button>
      </div>`).join("") : `
      <div style="background:#0f172a;padding:15px;border-radius:10px;text-align:center">
        <p style="color:#8b5cf6;margin:0">🚀 You are on the highest plan!</p>
        <p style="color:#94a3b8;font-size:13px">All features unlocked.</p>
      </div>`}
    </div>
  `);
}

async function upgradePlan(plan){
  const btns = document.querySelectorAll("button");
  btns.forEach(b => b.disabled = true);
  try {
    const res = await fetch("/api/paystack/init", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify({ email: currentUser?.email, plan })
    });
    const data = await res.json();
    if(data.data?.authorization_url){
      window.location.href = data.data.authorization_url;
    } else {
      alert("Payment init failed. Try again.");
      btns.forEach(b => b.disabled = false);
    }
  } catch(e){
    alert("Error: " + e.message);
    btns.forEach(b => b.disabled = false);
  }
}

/* =========================
   SETTINGS
========================= */
function renderSettings(){
  setView(`
    <div class="card">
      ${header("⚙️ Settings","dashboard")}

      <div style="margin-top:15px">
        <p onclick="loadPage('profile')" style="cursor:pointer">👤 Profile</p>
        <p onclick="loadPage('subscription')" style="cursor:pointer">💳 Subscription</p>
        <p onclick="loadPage('support')" style="cursor:pointer">🆘 Support</p>
        <p onclick="logout()" style="color:red;cursor:pointer">🚪 Logout</p>
      </div>
    </div>
  `);
}

/* =========================
   SUPPORT
========================= */
function renderSupport(){
  setView(`
    <div class="card">
      ${header("🆘 Support","dashboard")}
      <p>Coming soon...</p>
    </div>
  `);
}

/* =========================
   MENU CONTROL
========================= */
function toggleMenu(){
  const m = document.getElementById("menu");
  if(!m) return;
  m.style.display = m.style.display === "block" ? "none" : "block";
}

function closeMenu(){
  const m = document.getElementById("menu");
  if(m) m.style.display = "none";
}

/* =========================
   LOGOUT
========================= */
function logout(){
  const ok = confirm("Are you sure you want to logout?");
  if(ok){
    localStorage.removeItem("token");
    location.href = "/auth";
  }
}

/* =========================
   START APP
========================= */
init();
