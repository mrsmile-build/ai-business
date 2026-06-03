function showDashboard(){
  document.getElementById("pageBox").style.display = "none";
  document.getElementById("dashboardBox").style.display = "block";
}

/* OPEN PAGE VIEW */
function openPage(title, content){
  document.getElementById("dashboardBox").style.display = "none";

  const page = document.getElementById("pageBox");
  page.style.display = "block";

  page.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3>${title}</h3>
      <span onclick="showDashboard()" style="cursor:pointer;font-size:20px;">← Back</span>
    </div>

    <p style="opacity:0.85;line-height:1.6">${content}</p>
  `;
}

/* MENU ACTIONS */
function goAbout(){
  openPage("About AI Business",
  "AI Business helps automate leads, manage customers, and scale businesses efficiently.");
}

function goPolicy(){
  openPage("Policy",
  "We respect user privacy. Data is securely handled and never sold.");
}

function goSettings(){
  openPage("Settings",
  "Settings panel is under development.");
}

function logout(){
  alert("Logout clicked");
}
