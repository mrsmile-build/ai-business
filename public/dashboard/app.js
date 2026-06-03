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
  renderPage("Settings",
  "Settings panel is under development.");
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
