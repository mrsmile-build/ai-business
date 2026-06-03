const app = document.getElementById("app");

/* DASHBOARD */
function renderDashboard(){
  app.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <p>Total Leads: 0</p>
    </div>
  `;
}

/* PAGE SYSTEM */
function renderPage(title, content){
  app.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>${title}</h3>
        <span style="cursor:pointer" onclick="renderDashboard()">← Back</span>
      </div>
      <p style="opacity:0.85;line-height:1.6">${content}</p>
    </div>
  `;

  closeMenu();
}

/* FEATURES */
function goAbout(){
  renderPage("About AI Business",
  "AI Business helps automate leads, manage customers, and scale businesses efficiently.");
}

function goPolicy(){
  renderPage("Policy",
  "We respect user privacy. Data is securely handled and never sold.");
}

function goSettings(){
  app.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Settings</h3>
        <span style="cursor:pointer" onclick="renderDashboard()">← Back</span>
      </div>
      <div style="margin-top:15px">
        <p>👤 Profile</p>
        <p>🔔 Notifications (Coming Soon)</p>
        <p>📊 Analytics (Coming Soon)</p>
        <p>💳 Subscription (Coming Soon)</p>
        <p>🔒 Security (Coming Soon)</p>
        <p onclick="logout()" style="color:#ff6b6b;cursor:pointer">🚪 Logout</p>
      </div>
    </div>
  `;
  closeMenu();
}

/* MENU CONTROL */
function toggleMenu(){
  const m = document.getElementById("menu");
  if(!m) return;
  m.style.display = (m.style.display === "block") ? "none" : "block";
}

function closeMenu(){
  const m = document.getElementById("menu");
  if(m) m.style.display = "none";
}

/* INIT */
renderDashboard();

function logout(){
  const ok = confirm("Are you sure you want to logout?");
  if(ok){
    alert("Logout system will be connected in a future version.");
  }
}
