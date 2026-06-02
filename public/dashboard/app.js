/* =========================
   LOAD LEADS
========================= */
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
      leads.map(lead => `
        <div class="card">
          <b>${lead.name || "Unknown"}</b><br/>
          <small>${lead.phone || ""}</small>
          <p>${lead.message || ""}</p>
          <p>🤖 ${lead.ai_reply || "Pending"}</p>
        </div>
      `).join("");

  } catch (err) {
    document.getElementById("status").innerText =
      "Error loading leads ❌";
  }
}

/* =========================
   LOGOUT (BASIC)
========================= */
function logout() {
  localStorage.clear();
  window.location.href = "/";
}
