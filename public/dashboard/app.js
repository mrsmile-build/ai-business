alert("APP JS LOADED");
console.log("DASHBOARD JS STARTED");
const supabase = window.supabase.createClient(
  "https://qewmhaualndadheoaxkm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFld21oYXVhbG5kYWRoZW9heGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODQsImV4cCI6MjA5NTcxOTc4NH0.go23TjvFYLJmUAxIZYU0fEqtHmUjJA3GVS0Ecu94k4E"
);

let currentUser = null;

/* =========================
   INIT USER
========================= */
window.addEventListener("load", async () => {
  console.log("INIT RUNNING");

  let data;
  try {
    const res = await supabase.auth.getUser();
    data = res.data;
  } catch (e) {
    console.log("AUTH ERROR:", e);
    document.getElementById("userBox").innerText = "Auth error";
    return;
  }

  if (!data?.user) {
    window.location.href = "/auth";
    return;
  }

  window.currentUser = data.user;

  document.getElementById("userBox").innerText = data.user.email;

  loadLeads();
});

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

    document.getElementById("leads").innerHTML =
      leads.length
        ? leads.map(l => `
            <div class="card">
              <b>${l.name || "Unknown"}</b><br/>
              <small>${l.phone || ""}</small>
              <p>${l.message || ""}</p>
              <p>🤖 ${l.ai_reply || "Pending"}</p>
            </div>
          `).join("")
        : "<div class='card'>No leads yet</div>";

  } catch (err) {
    document.getElementById("leads").innerHTML =
      "<div class='card'>Error loading leads</div>";
  }
}

/* =========================
   MENU
========================= */
window.toggleMenu = function () {
  const m = document.getElementById("menu");
  if (!m) return;
  m.classList.toggle("show");
};
  await supabase.auth.signOut();
  window.location.href = "/auth";
};

window.goAbout = () => alert("AI Business SaaS");
window.goPolicy = () => alert("Privacy Policy");
window.goUpgrade = () => alert("Upgrade coming soon");

