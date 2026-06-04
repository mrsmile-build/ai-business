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
  } catch (e) {}

  renderDashboard();
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

/* ROUTER */
function loadPage(page){
  closeMenu();

  switch(page){
    case "dashboard":
      renderDashboard();
      break;

    case "profile":
      renderProfile();
      break;

    case "analytics":
      renderAnalytics();
      break;

    case "leads":
      renderLeads();
      break;

    case "aiTools":
      renderAITools();
      break;

    case "subscription":
      renderSubscription();
      break;

    case "settings":
      renderSettings();
      break;

    case "support":
      renderSupport();
      break;

    default:
      renderDashboard();
  }
}

/* PROFILE */
function renderProfile(){
  app.innerHTML = `
    <div class="card">
      <h3>👤 Profile</h3>

      <p>Email: ${currentUser?.email || "Loading..."}</p>
      <p>Username: ${currentUser?.email?.split("@")[0] || ""}</p>

      <br>

      <span onclick="loadPage('settings')" style="cursor:pointer">
      ← Back to Settings
      </span>
    </div>
  `;
}

/* ANALYTICS */
function renderAnalytics(){
  app.innerHTML = `
    <div class="card">
      <h3>📊 Analytics</h3>
      <p>Coming soon...</p>

      <br>

      <span onclick="loadPage('dashboard')" style="cursor:pointer">
      ← Back to Dashboard
      </span>
    </div>
  `;
}

/* LEADS */
function renderLeads(){
  app.innerHTML = `
    <div class="card">
      <h3>📩 Leads</h3>
      <p>No leads yet</p>

      <br>

      <span onclick="loadPage('dashboard')" style="cursor:pointer">
      ← Back to Dashboard
      </span>
    </div>
  `;
}

/* AI TOOLS */
function renderAITools(){
  app.innerHTML = `
    <div class="card">
      <h3>🧠 AI Tools</h3>
      <p>Coming soon...</p>

      <br>

      <span onclick="loadPage('dashboard')" style="cursor:pointer">
      ← Back to Dashboard
      </span>
    </div>
  `;
}

/* SUBSCRIPTION */
function renderSubscription(){
  app.innerHTML = `
    <div class="card">
      <h3>💳 Subscription</h3>

      <p>Free Plan</p>

      <br>

      <span onclick="loadPage('settings')" style="cursor:pointer">
      ← Back to Settings
      </span>
    </div>
  `;
}

/* SETTINGS */
function renderSettings(){
  app.innerHTML = `
    <div class="card">

      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>⚙️ Settings</h3>

        <span onclick="loadPage('dashboard')" style="cursor:pointer">
        ← Dashboard
        </span>
      </div>

      <div style="margin-top:15px">

        <p onclick="loadPage('profile')" style="cursor:pointer">
        👤 Profile
        </p>

        <p>
        🔔 Notifications (Coming Soon)
        </p>

        <p>
        🔐 Security (Coming Soon)
        </p>

        <p onclick="loadPage('subscription')" style="cursor:pointer">
        💳 Subscription
        </p>

        <p onclick="logout()" style="color:red;cursor:pointer">
        🚪 Logout
        </p>

      </div>

    </div>
  `;
}

/* SUPPORT */
function renderSupport(){
  app.innerHTML = `
    <div class="card">
      <h3>🆘 Support</h3>
      <p>Coming soon...</p>

      <br>

      <span onclick="loadPage('dashboard')" style="cursor:pointer">
      ← Back to Dashboard
      </span>
    </div>
  `;
}

/* MENU */
function toggleMenu(){
  const m = document.getElementById("menu");

  if(!m) return;

  m.style.display =
    m.style.display === "block"
    ? "none"
    : "block";
}

function closeMenu(){
  const m = document.getElementById("menu");

  if(m){
    m.style.display = "none";
  }
}

/* LOGOUT */
function logout(){
  localStorage.removeItem("token");
  alert("Logged out");
  location.href = "/auth";
}

/* START */
init();
