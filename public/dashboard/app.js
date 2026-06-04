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
  } catch (e) {}

  loadPage("dashboard");
}

/* =========================
   CLEAN RENDER ENGINE
========================= */
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
        <p><strong>Total Leads:</strong> 0</p>
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
      <h3>👤 Profile</h3>

      <p>Email: ${currentUser?.email || "Loading..."}</p>
      <p>Username: ${currentUser?.email?.split("@")[0] || ""}</p>

      <button onclick="loadPage('settings')">← Back</button>
    </div>
  `);
}

/* =========================
   ANALYTICS
========================= */
function renderAnalytics(){
  setView(`
    <div class="card">
      <h3>📊 Analytics</h3>
      <p>Coming soon...</p>

      <button onclick="loadPage('dashboard')">← Back</button>
    </div>
  `);
}

/* =========================
   LEADS
========================= */
function renderLeads(){
  setView(`
    <div class="card">
      <h3>📩 Leads</h3>
      <p>No leads yet</p>

      <button onclick="loadPage('dashboard')">← Back</button>
    </div>
  `);
}

/* =========================
   AI TOOLS
========================= */
function renderAITools(){
  setView(`
    <div class="card">
      <h3>🧠 AI Tools</h3>
      <p>This will become your MONEY engine</p>

      <button onclick="loadPage('dashboard')">← Back</button>
    </div>
  `);
}

/* =========================
   SUBSCRIPTION
========================= */
function renderSubscription(){
  setView(`
    <div class="card">
      <h3>💳 Subscription</h3>
      <p>Plan: Free</p>

      <button onclick="loadPage('dashboard')">← Back</button>
    </div>
  `);
}

/* =========================
   SETTINGS
========================= */
function renderSettings(){
  setView(`
    <div class="card">
      <h3>⚙️ Settings</h3>

      <div style="margin-top:15px">
        <p onclick="loadPage('profile')" style="cursor:pointer">👤 Profile</p>
        <p onclick="loadPage('subscription')" style="cursor:pointer">💳 Subscription</p>
        <p onclick="loadPage('support')" style="cursor:pointer">🆘 Support</p>
        <p onclick="logout()" style="color:red;cursor:pointer">🚪 Logout</p>
      </div>

      <button onclick="loadPage('dashboard')">← Dashboard</button>
    </div>
  `);
}

/* =========================
   SUPPORT
========================= */
function renderSupport(){
  setView(`
    <div class="card">
      <h3>🆘 Support</h3>
      <p>Coming soon...</p>

      <button onclick="loadPage('dashboard')">← Back</button>
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
