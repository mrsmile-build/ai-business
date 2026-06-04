const app = document.getElementById("app");

let currentUser = null;

/* INIT */
async function init(){
  try {
    const res = await fetch("/api/me", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await res.json();
    currentUser = data.user;

    renderDashboard();
  } catch (e) {
    renderDashboard();
  }
}

/* DASHBOARD */
function renderDashboard(){
  app.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <p>Total Leads: 0</p>
      <p style="opacity:0.7">${currentUser?.email || ""}</p>
    </div>
  `;
}

/* SIMPLE ROUTER */
function loadPage(page){
  switch(page){
    case "dashboard":
      return renderDashboard();
    case "profile":
      return renderProfile();
    case "analytics":
      return renderAnalytics();
    case "leads":
      return renderLeads();
    case "aiTools":
      return renderAITools();
    case "subscription":
      return renderSubscription();
    case "settings":
      return renderSettings();
    case "support":
      return renderSupport();
    default:
      return renderDashboard();
  }
}

/* PAGES */
function renderProfile(){
  app.innerHTML = `
    <div class="card">
      <h3>👤 Profile</h3>
      <p>Email: ${currentUser?.email || "Loading..."}</p>
      <p>Username: ${currentUser?.email?.split("@")[0] || ""}</p>
      <span onclick="loadPage('settings')" style="cursor:pointer">← Back</span>
    </div>
  `;
}

function renderAnalytics(){
  app.innerHTML = `<div class="card"><h3>📊 Analytics</h3><p>Coming soon...</p></div>`;
}

function renderLeads(){
  app.innerHTML = `<div class="card"><h3>📩 Leads</h3><p>No leads yet</p></div>`;
}

function renderAITools(){
  app.innerHTML = `<div class="card"><h3>🧠 AI Tools</h3><p>Coming soon...</p></div>`;
}

function renderSubscription(){
  app.innerHTML = `<div class="card"><h3>💳 Subscription</h3><p>Free Plan</p></div>`;
}

/* SETTINGS (MAIN FOCUS) */
function renderSettings(){
  app.innerHTML = `
    <div class="card">
      <h3>⚙️ Settings</h3>

      <div style="margin-top:15px">
        <p onclick="loadPage('profile')" style="cursor:pointer">👤 Profile</p>
        <p>🔔 Notifications (Coming Soon)</p>
        <p>🔐 Security (Coming Soon)</p>
        <p onclick="loadPage('subscription')" style="cursor:pointer">💳 Subscription</p>
        <p onclick="logout()" style="color:red;cursor:pointer">🚪 Logout</p>
      </div>
    </div>
  `;
}

function renderSupport(){
  app.innerHTML = `<div class="card"><h3>🆘 Support</h3><p>Coming soon...</p></div>`;
}

/* MENU */
function toggleMenu(){
  const m = document.getElementById("menu");
  if(!m) return;
  m.style.display = m.style.display === "block" ? "none" : "block";
}

function closeMenu(){
  const m = document.getElementById("menu");
  if(m) m.style.display = "none";
}

/* LOGOUT */
function logout(){
  localStorage.removeItem("token");
  alert("Logged out");
  location.href = "/auth";
}

/* INIT */
init();
renderDashboard();
