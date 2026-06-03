import { supabase } from "../auth/supabase.js";

let currentUser = null;

/* =========================
   INIT APP
========================= */
async function init() {
  try {
    showStatus("Checking session...");

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      window.location.href = "/auth";
      return;
    }

    currentUser = data.user;

    showUser(currentUser);
    await loadLeads();

  } catch (err) {
    console.error(err);
    showStatus("Auth error. Please refresh.");
  }
}

/* =========================
   USER DISPLAY
========================= */
function showUser(user) {
  const box = document.getElementById("userBox");
  if (box) {
    box.innerText = "Logged in: " + user.email;
  }
}

/* =========================
   LOAD LEADS (USER SAFE)
========================= */
async function loadLeads() {
  try {
    const res = await fetch(`/api/leads/${currentUser.id}`);
    const data = await res.json();

    const leads = data.leads || [];

    document.getElementById("total").innerText =
      "Total Leads: " + leads.length;

    renderLeads(leads);

  } catch (err) {
    console.error(err);
    document.getElementById("leads").innerHTML =
      "<div class='card'>Failed to load leads</div>";
  }
}

/* =========================
   RENDER LEADS
========================= */
function renderLeads(leads) {
  const container = document.getElementById("leads");

  if (!leads.length) {
    container.innerHTML = "<div class='card'>No leads yet</div>";
    return;
  }

  container.innerHTML = leads.map(l => `
    <div class="card">
      <b>${l.name || "Unknown"}</b><br/>
      <small>${l.phone || ""}</small>
      <p>${l.message || ""}</p>
      <p>🤖 ${l.ai_reply || "Pending"}</p>
    </div>
  `).join("");
}

/* =========================
   STATUS
========================= */
function showStatus(text) {
  const el = document.getElementById("total");
  if (el) el.innerText = text;
}

/* =========================
   LOGOUT
========================= */
window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/auth";
};

/* =========================
   MENU
========================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  if (!m) return;
  m.style.display = m.style.display === "block" ? "none" : "block";
};

/* =========================
   INIT
========================= */
init();
