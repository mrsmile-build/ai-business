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
