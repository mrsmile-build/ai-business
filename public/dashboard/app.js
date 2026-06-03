const app = document.getElementById("app");

/* DASHBOARD */
function renderDashboard(){
  app.innerHTML = `
    <div class="card">
      <h2>Dashboard Overview</h2>
      <p>Total Leads: 0</p>
    </div>
  `;
}

/* ABOUT */
function renderAbout(){
  app.innerHTML = `
    <div class="card">
      <h2>About AI Business</h2>
      <p>AI Business helps automate leads, manage customers, and scale businesses efficiently.</p>
      <button onclick="renderDashboard()">← Back to Dashboard</button>
    </div>
  `;
}

/* POLICY */
function renderPolicy(){
  app.innerHTML = `
    <div class="card">
      <h2>Policy</h2>
      <p>We respect user privacy. Data is securely handled and never sold.</p>
      <button onclick="renderDashboard()">← Back to Dashboard</button>
    </div>
  `;
}

/* PRIVACY */
function renderPrivacy(){
  app.innerHTML = `
    <div class="card">
      <h2>Privacy Policy</h2>
      <p>Your data is securely stored and protected with encryption.</p>
      <button onclick="renderDashboard()">← Back to Dashboard</button>
    </div>
  `;
}

/* MENU */
function renderMenu(){
  const choice = prompt("Type: about / policy / privacy");

  if(choice === "about") renderAbout();
  else if(choice === "policy") renderPolicy();
  else if(choice === "privacy") renderPrivacy();
  else renderDashboard();
}

/* INIT */
renderDashboard();
