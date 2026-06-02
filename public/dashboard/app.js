/* =========================
   AUTO LOAD DASHBOARD
========================= */

async function loadLeads() {
  const status = document.getElementById("status");

  status.innerText = "Loading leads...";
  status.className = "status loading";

  try {
    // TEMP: using test user until auth layer (v1.3)
    const userId = "test123";

    const res = await fetch(`/api/leads/${userId}`);
    const data = await res.json();

    const leads = data.leads || [];

    document.getElementById("total").innerText =
      "Total Leads: " + leads.length;

    if (leads.length === 0) {
      document.getElementById("leads").innerHTML = `
        <div class="empty">
          No leads yet. Share your link to start receiving leads.
        </div>
      `;
      status.innerText = "No data";
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

    status.innerText = "Live ✔";
    status.className = "status";

  } catch (err) {
    status.innerText = "Network error ❌";
  }
}

/* =========================
   AUTO START
========================= */
window.addEventListener("load", () => {
  loadLeads();

  // auto refresh every 15s
  setInterval(loadLeads, 15000);
});
