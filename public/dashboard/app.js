async function loadLeads() {
  const userId = document.getElementById("userId").value;

  if (!userId) {
    alert("Enter User ID");
    return;
  }

  document.getElementById("status").innerText = "Loading...";

  try {
    const res = await fetch(`/api/leads/${userId}`);
    const data = await res.json();

    const leads = data.leads || [];

    document.getElementById("total").innerText =
      "Total Leads: " + leads.length;

    document.getElementById("status").innerText =
      "Live ✔";

    document.getElementById("leads").innerHTML =
      leads.map(l => `
        <div class="card">
          <b>${l.name || "Unknown"}</b><br/>
          <small>${l.phone || ""}</small>
          <p>${l.message || ""}</p>
          <p>🤖 ${l.ai_reply || "Pending"}</p>
        </div>
      `).join("");

  } catch (err) {
    document.getElementById("status").innerText =
      "Error loading leads ❌";
  }
}

/* =========================
   MENU SYSTEM
========================= */

function toggleMenu(){
  const m = document.getElementById("menu");
  if(!m) return;
  m.style.display = (m.style.display === "block") ? "none" : "block";
}

function logout(){
  alert("Logout clicked");
}

function goAbout(){
  alert("About AI Business");
}

function goPolicy(){
  alert("Privacy Policy");
}

function goSettings(){
  alert("Settings coming soon");
}

function closePage(){
  const box = document.getElementById("pageBox");
  if(box) box.style.display = "none";
}

window.closePage = function(){
  const box = document.getElementById("pageBox");
  if(box) box.style.display = "none";
};


function goAbout(){
  showPage("About AI Business",
  "AI Business helps automate leads, manage customers, and scale businesses using smart tools.");
}

function goPolicy(){
  showPage("Policy",
  "We respect user privacy. Data is securely handled and never sold.");
}

function goSettings(){
  showPage("Settings",
  "Settings panel coming soon: subscription, profile, notifications.");
}
