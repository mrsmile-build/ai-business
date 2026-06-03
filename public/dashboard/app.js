import { supabase } from "../auth/supabase.js";

let currentUser = null;

/* =========================
   AUTH CHECK
========================= */
async function initAuth() {
  const { data } = await supabase.auth.getUser();

  if (!data || !data.user) {
    window.location.href = "/auth";
    return;
  }

  currentUser = data.user;

  document.getElementById("userBox").innerText =
    "Logged in: " + currentUser.email;

  loadLeads();
}

/* =========================
   LOAD LEADS
========================= */
async function loadLeads() {
  try {
    const res = await fetch(`/api/leads/${currentUser.id}`);
    const data = await res.json();

    const leads = data.leads || [];

    document.getElementById("total").innerText =
      "Total Leads: " + leads.length;

    if (leads.length === 0) {
      document.getElementById("leads").innerHTML =
        "<div class='card'>No leads yet</div>";
      return;
    }

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
    document.getElementById("leads").innerHTML =
      "<div class='card'>Error loading leads</div>";
  }
}

/* =========================
   LOGOUT
========================= */
window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/auth";
};

/* =========================
   START
========================= */
initAuth();
