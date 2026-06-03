/* =========================
   INIT SUPABASE
========================= */
const supabase = window.supabase.createClient(
  "https://qewmhaualndadheoaxkm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFld21oYXVhbG5kYWRoZW9heGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODQsImV4cCI6MjA5NTcxOTc4NH0.go23TjvFYLJmUAxIZYU0fEqtHmUjJA3GVS0Ecu94k4E"
);

let user = null;

/* =========================
   START
========================= */
window.addEventListener("load", async () => {
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    window.location.href = "/auth";
    return;
  }

  user = data.user;

  document.getElementById("userBox").innerText =
    user.email;

  loadLeads();
});

/* =========================
   LOAD LEADS
========================= */
async function loadLeads() {
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
}

/* =========================
   MENU
========================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};

window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/auth";
};

window.goSettings = () => alert("Settings coming soon");
window.goAbout = () => alert("About AI Business");
window.goPolicy = () => alert("Privacy Policy");

console.log("window.supabase =", window.supabase);
console.log("Supabase loaded");

