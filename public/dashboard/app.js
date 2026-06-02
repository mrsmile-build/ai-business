import { supabase } from "../auth/supabase.js";

let currentUser = null;

/* =========================
   INIT AUTH (silent)
========================= */
async function init() {
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    window.location.href = "/auth";
    return;
  }

  currentUser = data.user;

  document.getElementById("userBox").innerText =
    currentUser.email;

  loadLeads();
}

/* =========================
   LOAD LEADS
========================= */
async function loadLeads() {
  const res = await fetch(`/api/leads/${currentUser.id}`);
  const data = await res.json();

  const leads = data.leads || [];

  document.getElementById("total").innerText =
    "Total Leads: " + leads.length;

  document.getElementById("leads").innerHTML =
    leads.map(l => `
      <div class="card">
        <b>${l.name || "Unknown"}</b><br/>
        <small>${l.phone || ""}</small>
        <p>${l.message || ""}</p>
        <p>🤖 ${l.ai_reply || "Pending"}</p>
      </div>
    `).join("");
}

/* =========================
   MENU CONTROL
========================= */
window.toggleMenu = () => {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/auth";
};

window.goSettings = () => alert("Settings coming soon");
window.goAbout = () => alert("AI Business v1 SaaS");
window.goPolicy = () => alert("Privacy Policy coming soon");

/* =========================
   START
========================= */
init();
