async function loadLeads() {

  const userId = document.getElementById("userId").value;

  document.getElementById("status").innerText = "Status: Loading...";

  try {

    const res = await fetch(`/api/leads/${userId}`);
    const data = await res.json();

    const leads = data.leads || [];

    document.getElementById("total").innerText =
      "Total Leads: " + leads.length;

    document.getElementById("status").innerText =
      "Status: Live ✔";

    document.getElementById("leads").innerHTML =
      leads.map(lead => `
        <div class="card">
          <h3>${lead.name || "Unknown"}</h3>
          <p>${lead.phone || ""}</p>
          <p>${lead.message || ""}</p>
          <p>🤖 ${lead.ai_reply || "Not generated yet"}</p>
        </div>
      `).join("");

  } catch (err) {

    document.getElementById("status").innerText =
      "Status: Error ❌";

  }

}
