import { supabase } from "../auth/supabase.js";

/* =========================
   SESSION CHECK
========================= */
async function checkAuth() {
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    window.location.href = "/auth";
    return null;
  }

  document.getElementById("status").innerText =
    "Logged in as: " + data.user.email;

  return data.user;
}

/* =========================
   LOAD LEADS
========================= */
async function loadLeads(user) {
  try {
    const res = await fetch(`/api/leads/${user.id}`);
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

  } catch (err) {
    document.getElementById("status").innerText =
      "Error loading leads";
  }
}

/* =========================
   LOGOUT (REAL)
========================= */
window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/auth";
};

/* =========================
   INIT
========================= */
(async () => {
  const user = await checkAuth();
  if (!user) return;

  await loadLeads(user);
})();
