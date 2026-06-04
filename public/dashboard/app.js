const app = document.getElementById("app");

let currentUser = null;
let currentSub = null;

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
function renderDashboard(){
setView(`
    <div class="card">
      <h2>📊 AI Business Control Center</h2>
      <div style="margin-top:15px">
        <p><strong>Email:</strong> ${currentUser?.email || "Loading..."}</p>
        <p><strong>Plan:</strong> ${currentSub?.plan === "pro" ? "⭐ Pro" : "Free"}</p>
        <p><strong>AI Uses:</strong> ${currentSub?.ai_usage || 0} / ${currentSub?.plan === "pro" ? "Unlimited" : "5"}</p>
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
function renderLeads(){
  setView(`
    <div class="card">
      ${header("📩 Leads","dashboard")}
      <p>No leads yet</p>
    </div>
  `);
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
function renderSubscription(){
  setView(`
    <div class="card">
      ${header("💳 Subscription","dashboard")}
      <p>Plan: Free</p>
    </div>
  `);
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
