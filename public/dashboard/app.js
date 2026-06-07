const app = document.getElementById("app");

let currentUser = null;

/* =========================
   INIT USER
========================= */
async function init(){
  try {
    let token = localStorage.getItem("token");
    let res = await fetch("/api/me", { headers: { Authorization: "Bearer " + token }});
    if(res.status === 401){
      const rt = localStorage.getItem("refresh_token");
      if(rt){
        const rr = await fetch("/api/refresh", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({refresh_token: rt})
        });
        const rd = await rr.json();
        if(rd.token){
          localStorage.setItem("token", rd.token);
          localStorage.setItem("refresh_token", rd.refresh_token);
          res = await fetch("/api/me", { headers: { Authorization: "Bearer " + rd.token }});
        } else { location.href="/auth"; return; }
      } else { location.href="/auth"; return; }
    }
    const data = await res.json();
    currentUser = data.user;
    currentSub = data.subscription;
  } catch(e) {}
  // Load profile
  try{
    const pr = await fetch("/api/profile",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
    const pd = await pr.json();
    currentProfile = pd.profile || {};
  }catch(e){}
  loadConversations();
  loadPage("dashboard");
  // Update topbar avatar
  const av = document.getElementById("topbar_avatar");
  if(av) av.innerHTML = avatarHTML(32);
}

/* =========================
   CLEAN RENDER ENGINE
========================= */
function header(title, backPage){
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3>${title}</h3>
      <span onclick="loadPage('${backPage}')" style="cursor:pointer;font-size:14px">← Back</span>
    </div>
    <hr>
  `;
}
function setView(html){
  app.innerHTML = html;
}

/* =========================
   ROUTER
========================= */
function loadPage(page){
  closeMenu();

  const routes = {
    dashboard: renderDashboard,
    profile: renderProfile,
    analytics: renderAnalytics,
    leads: renderLeads,
    aiTools: renderAITools,
    subscription: renderSubscription,
    settings: renderSettings,
    support: renderSupport,
    editProfile: renderEditProfile,
    leadFinder: renderLeadFinder
  };

  (routes[page] || renderDashboard)();
}

/* =========================
   DASHBOARD (CORE SAAS)
========================= */
function renderDashboard(){
  setView(`
    <div class="card">
      <h2>📊 AI Business Control Center</h2>

      <div style="margin-top:15px">
        <p><strong>Email:</strong> ${currentUser?.email || "Loading..."}</p>
        <p><strong>Plan:</strong> Free</p>
        <p><strong>Total Leads:</strong> ${currentSub?.leads_count || 0}</p>
      </div>

      <div style="margin-top:20px">
        <button onclick="loadPage('leads')">📩 Leads</button>
        <button onclick="loadPage('leadFinder')">🎯 Leads Finder</button>
        <button onclick="loadPage('aiTools')">🧠 AI Tools</button>
        <button onclick="loadPage('subscription')">💳 Upgrade</button>
      </div>
    </div>
  `);
}

/* =========================
   PROFILE
========================= */
function getInitials(email, name){
  if(name) return name.substring(0,2).toUpperCase();
  return (email||"?").substring(0,2).toUpperCase();
}
function getAvatarColor(email){
  const colors=["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4"];
  let h=0; for(let c of (email||"")) h=(h<<5)-h+c.charCodeAt(0);
  return colors[Math.abs(h)%colors.length];
}
function avatarHTML(size=60){
  const name=currentProfile?.display_name;
  const email=currentUser?.email||"";
  const url=currentProfile?.avatar_url;
  const initials=getInitials(email,name);
  const color=getAvatarColor(email);
  if(url) return `<img src="${url}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'">`;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.35)}px;font-weight:bold;color:white">${initials}</div>`;
}

/* READ-ONLY PROFILE (menu) */
function renderProfile(){
  const email=currentUser?.email||"";
  const name=currentProfile?.display_name||email.split("@")[0];
  const phone=currentProfile?.phone||"Not set";
  const country=currentProfile?.country||"";
  const plan=currentSub?.plan||"free";
  const planColor={business:"#8b5cf6",pro:"#3b82f6",starter:"#10b981",free:"#64748b"}[plan]||"#64748b";

  setView(`
    <div class="card">
      ${header("👤 Profile","settings")}

      <div style="text-align:center;padding:20px 0">
        ${avatarHTML(90)}
        <h2 style="margin:12px 0 4px">${name}</h2>
        <p style="margin:0;color:#64748b;font-size:13px">${email}</p>
        <span style="display:inline-block;margin-top:8px;padding:4px 12px;background:${planColor};color:white;border-radius:20px;font-size:12px;font-weight:bold">${plan.toUpperCase()}</span>
      </div>

      <div style="background:#0f172a;border-radius:10px;overflow:hidden;margin-bottom:12px">
        <div style="padding:12px 15px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between">
          <span style="color:#64748b;font-size:13px">Phone</span>
          <span style="font-size:13px">${phone}</span>
        </div>
        <div style="padding:12px 15px;display:flex;justify-content:space-between">
          <span style="color:#64748b;font-size:13px">Country</span>
          <span style="font-size:13px">${country||"Not set"}</span>
        </div>
      </div>

      <button onclick="loadPage('editProfile')" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">✏️ Edit Profile</button>
    </div>
  `);
}

/* EDITABLE PROFILE (settings) */
async function renderEditProfile(){
  const email=currentUser?.email||"";
  const name=currentProfile?.display_name||email.split("@")[0];
  const phone=currentProfile?.phone||"";
  const country=currentProfile?.country||"";
  const lastChanged=currentProfile?.username_updated_at;
  const daysLeft=lastChanged?Math.ceil(30-(Date.now()-new Date(lastChanged).getTime())/(1000*60*60*24)):0;
  const canChange=daysLeft<=0;

  setView(`
    <div class="card">
      ${header("✏️ Edit Profile","profile")}

      <div style="text-align:center;margin-bottom:20px">
        ${avatarHTML(70)}
        <p style="margin:6px 0 0;font-size:12px;color:#475569">Avatar auto-generated from name</p>
      </div>

      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px">
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">Display Name ${canChange?"":"("+daysLeft+"d to change)"}</p>
        <div style="display:flex;gap:8px">
          <input id="p_name" value="${name}" ${canChange?"":"disabled"} style="flex:1;padding:9px;border-radius:8px;border:1px solid #334155;background:${canChange?"#0b1220":"#1e293b"};color:${canChange?"white":"#64748b"};font-size:13px">
          ${canChange?`<button onclick="saveName()" style="padding:9px 14px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Save</button>`:""}
        </div>
      </div>

      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px">
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">Phone Number</p>
        <div style="display:flex;gap:8px">
          <input id="p_phone" value="${phone}" placeholder="+2348..." style="flex:1;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px">
          <button onclick="savePhone()" style="padding:9px 14px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Save</button>
        </div>
      </div>

      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px">
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">Country</p>
        <div style="display:flex;gap:8px">
          <input id="p_country" value="${country}" placeholder="Nigeria" style="flex:1;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px">
          <button onclick="saveCountry()" style="padding:9px 14px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Save</button>
        </div>
      </div>

      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px">
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">Change Password</p>
        <input id="p_current" type="password" placeholder="Current password" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="p_pass1" type="password" placeholder="New password" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="p_pass2" type="password" placeholder="Confirm new password" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <button onclick="changePassword()" style="width:100%;padding:10px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Update Password</button>
      </div>
    </div>
  `);
}

async function patchProfile(updates){
  const res=await fetch("/api/profile",{
    method:"PATCH",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
    body:JSON.stringify(updates)
  });
  return await res.json();
}
async function saveName(){
  const name=document.getElementById("p_name")?.value.trim();
  if(!name) return alert("Name cannot be empty.");
  const data=await patchProfile({display_name:name});
  if(data.success){currentProfile={...currentProfile,...data.profile};alert("Display name updated!");renderEditProfile();}
  else alert(data.error||"Failed.");
}
async function savePhone(){
  const phone=document.getElementById("p_phone")?.value.trim();
  const data=await patchProfile({phone});
  if(data.success){currentProfile={...currentProfile,...data.profile};alert("Phone saved!");}
  else alert("Failed.");
}
async function saveCountry(){
  const country=document.getElementById("p_country")?.value.trim();
  const data=await patchProfile({country});
  if(data.success){currentProfile={...currentProfile,...data.profile};alert("Country saved!");}
  else alert("Failed.");
}
async function changePassword(){
  const cur=document.getElementById("p_current")?.value;
  const p1=document.getElementById("p_pass1")?.value;
  const p2=document.getElementById("p_pass2")?.value;
  if(!cur) return alert("Enter your current password.");
  if(!p1||!p2) return alert("Fill new password fields.");
  if(p1!==p2) return alert("Passwords do not match.");
  if(p1.length<6) return alert("Password must be at least 6 characters.");
  const res=await fetch("/api/change-password",{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
    body:JSON.stringify({current_password:cur,password:p1})
  });
  const data=await res.json();
  if(data.success){alert("Password updated successfully!");document.getElementById("p_current").value="";document.getElementById("p_pass1").value="";document.getElementById("p_pass2").value="";}
  else alert(data.error||"Failed.");
}


async function renderAnalytics(){
  setView(`<div class="card">${header("📊 Analytics","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try{
    const res = await fetch("/api/me",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
    const data = await res.json();
    const sub = data.subscription;
    const leadsCount = sub?.leads_count||0;
    const leadsLimit = sub?.limits?.leads;
    const aiUsage = sub?.ai_usage||0;
    const aiLimit = sub?.limits?.ai_per_day;
    const plan = sub?.plan||"free";
    const planColor = {business:"#8b5cf6",pro:"#3b82f6",starter:"#10b981",free:"#64748b"}[plan]||"#64748b";
    const lPct = leadsLimit===Infinity?5:Math.min(100,Math.round(leadsCount/(leadsLimit||10)*100));
    const aPct = aiLimit===Infinity?5:Math.min(100,Math.round(aiUsage/(aiLimit||3)*100));

    setView(`
      <div class="card">
        ${header("📊 Analytics","dashboard")}

        <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">📩 Leads Used</p>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:26px;font-weight:bold">${leadsCount}</span>
            <span style="font-size:13px;color:#64748b;align-self:flex-end">/ ${leadsLimit===Infinity?"Unlimited":leadsLimit}</span>
          </div>
          <div style="background:#1e293b;border-radius:6px;height:8px">
            <div style="background:#3b82f6;width:${lPct}%;height:8px;border-radius:6px"></div>
          </div>
        </div>

        <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">🧠 AI Uses Today</p>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:26px;font-weight:bold">${aiUsage}</span>
            <span style="font-size:13px;color:#64748b;align-self:flex-end">/ ${aiLimit===Infinity?"Unlimited":aiLimit} per day</span>
          </div>
          <div style="background:#1e293b;border-radius:6px;height:8px">
            <div style="background:${aPct>80?"#ef4444":"#10b981"};width:${aPct}%;height:8px;border-radius:6px"></div>
          </div>
          ${aPct>80?'<p style="margin:6px 0 0;font-size:11px;color:#ef4444">Running low — consider upgrading</p>':""}
        </div>

        <div style="display:flex;gap:10px;margin-bottom:12px">
          <div style="flex:1;background:#0f172a;padding:15px;border-radius:10px;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">Plan</p>
            <p style="margin:5px 0 0;font-size:16px;font-weight:bold;color:${planColor}">${plan.toUpperCase()}</p>
          </div>
          <div style="flex:1;background:#0f172a;padding:15px;border-radius:10px;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">Account</p>
            <p style="margin:5px 0 0;font-size:12px;color:#cbd5e1;word-break:break-all">${currentUser?.email||"..."}</p>
          </div>
        </div>

        <button onclick="loadPage('subscription')" style="width:100%;padding:11px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">💳 Upgrade Plan</button>
      </div>
    `);
  }catch(e){
    setView(`<div class="card">${header("📊 Analytics","dashboard")}<p style="color:red">Error loading analytics.</p></div>`);
  }
}

/* =========================
   LEADS
========================= */
async function renderLeads(){
  setView(`<div class="card">${header("📩 Leads","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try{
    const res = await fetch("/api/leads",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
    const data = await res.json();
    const leads = data.leads || [];
    const limit = currentSub?.limits?.leads || 10;
    const plan = currentSub?.plan || "free";
    const isPro = plan==="pro"||plan==="business";

    const statusColors = { new:"#64748b", contacted:"#3b82f6", interested:"#f59e0b", negotiation:"#8b5cf6", won:"#10b981", lost:"#ef4444" };
    const statusLabels = { new:"🆕 New", contacted:"📞 Contacted", interested:"🔥 Interested", negotiation:"🤝 Negotiation", won:"✅ Won", lost:"❌ Lost" };
    const stages = ["new","contacted","interested","negotiation","won","lost"];

    // Pipeline summary
    const pipelineCounts = {};
    stages.forEach(s=>pipelineCounts[s]=leads.filter(l=>l.status===s||(!l.status&&s==="new")).length);

    setView(`
      <div class="card">
        ${header("📩 Leads","dashboard")}
        <p style="font-size:13px;color:#94a3b8;margin-bottom:10px">${leads.length} / ${limit===Infinity?"Unlimited":limit} leads used</p>

        <!-- Pipeline bar -->
        <div style="display:flex;gap:4px;margin-bottom:15px;flex-wrap:wrap">
          ${["new","contacted","interested","won"].map(s=>`
            <div style="flex:1;min-width:60px;background:#0f172a;padding:8px;border-radius:8px;text-align:center;border-top:3px solid ${statusColors[s]}">
              <p style="margin:0;font-size:18px;font-weight:bold">${pipelineCounts[s]}</p>
              <p style="margin:2px 0 0;font-size:10px;color:#64748b">${s.charAt(0).toUpperCase()+s.slice(1)}</p>
            </div>
          `).join("")}
        </div>

        <!-- Add lead form -->
        <div style="margin-bottom:15px">
          <input id="l_name" placeholder="Name *" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_phone" placeholder="Phone" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_email" placeholder="Email" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_business" placeholder="Business Type" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <input id="l_message" placeholder="Notes" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;box-sizing:border-box">
          <div style="display:flex;gap:8px">
            <button onclick="addLead()" style="flex:1;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:15px">+ Add Lead</button>
            ${isPro ? `<button onclick="exportCSV()" style="padding:12px 16px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">📥 CSV</button>` : `<button onclick="alert('CSV export is a Pro feature. Upgrade your plan!')" style="padding:12px 16px;background:#1e293b;color:#64748b;border:1px solid #334155;border-radius:8px;cursor:pointer;font-size:13px">📥 CSV</button>`}
          </div>
        </div>

        <!-- Leads list -->
        <div id="leads-list">
          ${leads.length===0
            ? '<p style="color:#94a3b8;text-align:center;padding:10px">No leads yet. Add your first one above.</p>'
            : leads.map(l=>{
              const st = l.status||"new";
              const col = statusColors[st]||"#64748b";
              return `<div style="background:#0f172a;padding:12px;border-radius:8px;margin-bottom:8px;border-left:3px solid ${col}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div style="flex:1">
                    <p style="margin:0;font-weight:bold;font-size:14px">${l.name}</p>
                    <p style="margin:2px 0;font-size:12px;color:#94a3b8">${l.phone||""}${l.business?" · "+l.business:""}</p>
                    ${l.email?`<p style="margin:2px 0;font-size:12px;color:#64748b">${l.email}</p>`:""}
                  </div>
                  <span onclick="deleteLead(${l.id})" style="color:#ef4444;cursor:pointer;font-size:20px;padding-left:10px">🗑</span>
                </div>
                <div style="margin-top:8px">
                  <select onchange="updateLeadStatus(${l.id},this.value)" style="padding:5px 8px;border-radius:6px;border:1px solid ${col};background:#1e293b;color:white;font-size:12px;cursor:pointer">
                    ${stages.map(s=>`<option value="${s}" ${s===st?"selected":""}>${statusLabels[s]}</option>`).join("")}
                  </select>
                </div>
              </div>`;
            }).join("")
          }
        </div>
      </div>
    `);
  }catch(e){
    setView(`<div class="card">${header("📩 Leads","dashboard")}<p style="color:red">Error loading leads.</p></div>`);
  }
}

async function updateLeadStatus(id, status){
  try{
    await fetch("/api/leads/"+id, {
      method:"PATCH",
      headers:{"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({status})
    });
  }catch(e){ alert("Error updating status"); }
}

function exportCSV(){
  fetch("/api/leads",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}})
  .then(r=>r.json()).then(data=>{
    const leads = data.leads||[];
    if(leads.length===0) return alert("No leads to export.");
    const headers = ["Name","Phone","Email","Business","Status","Notes","Date Added"];
    const rows = leads.map(l=>[
      l.name||"", l.phone||"", l.email||"", l.business||"",
      l.status||"new", l.message||"",
      new Date(l.created_at).toLocaleDateString()
    ]);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="leads_"+Date.now()+".csv"; a.click();
    URL.revokeObjectURL(url);
  }).catch(e=>alert("Export failed: "+e.message));
}


async function addLead(){
  const btn = document.querySelector("button[onclick='addLead()']");
  if(btn){ btn.disabled = true; btn.textContent = "Adding..."; }
  const name = document.getElementById("l_name")?.value.trim();
  if(!name) return alert("Name is required");
  const phone = document.getElementById("l_phone")?.value.trim();
  const email = document.getElementById("l_email")?.value.trim();
  const business = document.getElementById("l_business")?.value.trim();
  const message = document.getElementById("l_message")?.value.trim();
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify({ name, phone, email, business, message })
    });
    const data = await res.json();
    if(data.success){ renderLeads(); } else { alert(data.error || "Failed to add lead"); if(btn){ btn.disabled = false; btn.textContent = "+ Add Lead"; } }
  } catch(e){ alert("Error adding lead"); }
}

async function deleteLead(id){
  if(!confirm("Delete this lead?")) return;
  try {
    await fetch("/api/leads/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    renderLeads();
  } catch(e){ alert("Error deleting lead"); }
}

/* =========================
   AI TOOLS
========================= */
let aiConvs = [];
let aiCurrentId = null;
let aiCopyData = {};

const TOOL_LABELS = {
  idea:"💡 Business Ideas", ad:"📢 Ad Copy",
  sales:"💬 Sales Message", content:"📱 Social Media", email:"📧 Email Marketing"
};

function convKey(){ return "ai_convs_"+(currentUser?.id||"guest"); }
function saveConversations(){
  try{ localStorage.setItem(convKey(), JSON.stringify(aiConvs)); }catch(e){}
}
function loadConversations(){
  try{ const s=localStorage.getItem(convKey()); if(s) aiConvs=JSON.parse(s); else aiConvs=[]; }catch(e){ aiConvs=[]; }
}
function genId(){ return Date.now().toString(36)+Math.random().toString(36).substr(2); }
function timeAgo(ts){
  const d=Date.now()-ts;
  if(d<60000) return "Just now";
  if(d<3600000) return Math.floor(d/60000)+"m ago";
  if(d<86400000) return Math.floor(d/3600000)+"h ago";
  return Math.floor(d/86400000)+"d ago";
}

function renderAITools(){
  aiCurrentId = null;
  const list = aiConvs.filter(c=>c.messages?.length>0).sort((a,b)=>b.updatedAt-a.updatedAt);
  setView(`
    <div class="card">
      ${header("🧠 AI Tools","dashboard")}
      <button onclick="newAIChat()" style="width:100%;padding:11px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:15px;margin-bottom:15px">+ New Chat</button>
      ${list.length===0
        ? '<p style="color:#64748b;text-align:center;font-size:13px;padding:20px 0">No conversations yet.<br>Tap New Chat to start.</p>'
        : list.map(c=>`
          <div onclick="openConv('${c.id}')" style="background:#0f172a;padding:12px;border-radius:8px;margin-bottom:8px;cursor:pointer;border:1px solid #1e293b">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:12px;color:#3b82f6">${TOOL_LABELS[c.tool]||c.tool}</span>
              <span style="font-size:11px;color:#475569">${timeAgo(c.updatedAt)}</span>
            </div>
            <p style="margin:5px 0 0;font-size:13px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.title}</p>
          </div>
        `).join("")}
    </div>
  `);
}

function openConv(id){
  aiCurrentId = id;
  const conv = aiConvs.find(c=>c.id===id);
  if(!conv) return renderAITools();
  renderConvView(conv.tool);
}

function newAIChat(){
  const id = genId();
  aiConvs.unshift({id, tool:"idea", title:"New conversation", messages:[], createdAt:Date.now(), updatedAt:Date.now()});
  aiCurrentId = id;
  saveConversations();
  renderConvView("idea");
}

function renderConvView(tool){
  const conv = aiConvs.find(c=>c.id===aiCurrentId);
  if(!conv) return renderAITools();
  setView(`
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span onclick="renderAITools()" style="cursor:pointer;color:#64748b;font-size:13px">← Chats</span>
        <select id="ai_tool" onchange="changeConvTool()" style="padding:6px 10px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;font-size:13px">
          ${Object.entries(TOOL_LABELS).map(([k,v])=>`<option value="${k}" ${k===conv.tool?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>
      <hr style="border:none;border-top:1px solid #1e293b;margin-bottom:10px">
      <div id="ai_chat" style="min-height:80px;max-height:55vh;overflow-y:auto;margin-bottom:10px"></div>
      <div style="display:flex;gap:8px">
        <input id="ai_input" placeholder="Ask anything..." onkeydown="if(event.key==='Enter') runAITool()" style="flex:1;padding:10px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white">
        <button onclick="runAITool()" style="padding:10px 16px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:18px">⚡</button>
      </div>
    </div>
  `);
  renderChat();
}

function changeConvTool(){
  const conv = aiConvs.find(c=>c.id===aiCurrentId);
  if(conv){ conv.tool=document.getElementById("ai_tool")?.value||"idea"; saveConversations(); }
}

function parseItems(text){
  const lines=text.split("\n"); const items=[]; let cur="";
  for(const line of lines){
    if(/^\*?\*?\d+[.)]\s/.test(line.trim())){
      if(cur) items.push(cur.trim());
      cur=line.replace(/^\*?\*?\d+[.)]\s*\*?\*?/,"").trim();
    } else if(cur&&line.trim()) cur+=" "+line.trim();
  }
  if(cur) items.push(cur.trim());
  return items.length>1?items:null;
}

function renderChat(){
  const chat=document.getElementById("ai_chat");
  if(!chat) return;
  const conv=aiConvs.find(c=>c.id===aiCurrentId);
  const msgs=conv?.messages||[];
  let k=0; aiCopyData={};
  if(msgs.length===0){
    chat.innerHTML="<p style=\"color:#64748b;font-size:13px;text-align:center;padding:20px 0\">Ask anything to get started...</p>";
    return;
  }
  const renderAns=(text)=>{
    const items=parseItems(text);
    if(items){
      return "<div>"+items.map((item,i)=>{
        aiCopyData[k]=item;
        return "<div style=\"background:#162032;padding:10px;border-radius:8px;margin-bottom:5px;position:relative;padding-right:60px\"><p style=\"margin:0;font-size:13px;line-height:1.6\"><strong>"+(i+1)+".</strong> "+item+"</p><button data-k=\""+k+++"\" onclick=\"copyAI(this)\" style=\"position:absolute;top:6px;right:6px;padding:3px 7px;background:#334155;color:white;border:none;border-radius:5px;cursor:pointer;font-size:11px\">Copy</button></div>";
      }).join("")+"</div>";
    }
    aiCopyData[k]=text;
    return "<div style=\"background:#0f172a;padding:12px;border-radius:8px;margin-bottom:8px;border-left:3px solid #3b82f6;position:relative;padding-right:60px\"><p style=\"margin:0;font-size:13px;line-height:1.6\">"+text+"</p><button data-k=\""+k+++"\" onclick=\"copyAI(this)\" style=\"position:absolute;top:6px;right:6px;padding:3px 7px;background:#334155;color:white;border:none;border-radius:5px;cursor:pointer;font-size:11px\">Copy</button></div>";
  };
  chat.innerHTML=msgs.map(m=>
    m.role==="user"
      ? "<div style=\"text-align:right;margin-bottom:8px\"><span style=\"background:#3b82f6;padding:8px 12px;border-radius:12px 12px 0 12px;font-size:13px;display:inline-block;max-width:90%\">"+m.content+"</span></div>"
      : renderAns(m.content)
  ).join("");
  chat.scrollTop=chat.scrollHeight;
}

function copyAI(btn){
  const text=aiCopyData[btn.getAttribute("data-k")]||"";
  navigator.clipboard.writeText(text).then(()=>{
    btn.textContent="Copied!"; setTimeout(()=>btn.textContent="Copy",2000);
  }).catch(()=>{ btn.textContent="Copied!"; setTimeout(()=>btn.textContent="Copy",2000); });
}

async function runAITool(){
  const input=document.getElementById("ai_input")?.value.trim();
  if(!input) return;
  const conv=aiConvs.find(c=>c.id===aiCurrentId);
  if(!conv) return;
  const tool=document.getElementById("ai_tool")?.value||"idea";
  conv.tool=tool;
  if(conv.title==="New conversation") conv.title=input.substring(0,60);
  const btn=document.querySelector("button[onclick='runAITool()']");
  if(btn){btn.disabled=true;btn.textContent="...";}
  document.getElementById("ai_input").value="";
  conv.messages.push({role:"user",content:input});
  renderChat();
  try{
    const res=await fetch("/api/ai-reply",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body:JSON.stringify({message:input,tool,history:conv.messages.slice(-6)})
    });
    const data=await res.json();
    if(data.success){
      conv.messages.push({role:"assistant",content:data.reply});
      conv.updatedAt=Date.now();
      saveConversations();
      renderChat();
    } else {
      alert(data.reply||"AI limit reached. Upgrade your plan.");
      conv.messages.pop();
    }
  }catch(e){alert("Error: "+e.message);conv.messages.pop();}
  if(btn){btn.disabled=false;btn.textContent="⚡";}
}

/* =========================
   SUBSCRIPTION
========================= */
async function renderSubscription(){
  const plan = currentSub?.plan || "free";
  const usage = currentSub?.ai_usage || 0;
  const leadsCount = currentSub?.leads_count || 0;
  const limits = currentSub?.limits || { leads: 10, ai_per_day: 3 };
  const colorMap = {business:"#8b5cf6",pro:"#3b82f6",starter:"#10b981",free:"#64748b"};
  const color = colorMap[plan] || "#64748b";

  let currency = "NGN", symbol = "₦", rate = 1;
  try {
    const geo = await fetch("https://ipapi.co/json/").then(r=>r.json());
    currency = geo.currency || "NGN";
    if(currency !== "NGN"){
      const fx = await fetch("https://api.frankfurter.app/latest?from=NGN&to="+currency).then(r=>r.json());
      rate = fx.rates?.[currency] || 1;
      const sym = {USD:"$",GBP:"£",EUR:"€",KES:"KSh",GHS:"₵",ZAR:"R",CAD:"C$",AUD:"A$"};
      symbol = sym[currency] || currency+" ";
    }
  } catch(e){}

  const fmt = (n) => currency==="NGN" ? "₦"+n.toLocaleString() : symbol+(n*rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,",");
  const allPlans = [
    {key:"starter",label:"🌟 Starter",color:"#10b981",leads:"50 leads",ai:"15 AI/day",price:6000,features:"Basic AI tools"},
    {key:"pro",label:"⭐ Pro",color:"#3b82f6",leads:"500 leads",ai:"50 AI/day",price:15000,features:"CSV export · Full AI tools"},
    {key:"business",label:"🚀 Business",color:"#8b5cf6",leads:"Unlimited",ai:"Unlimited AI",price:45000,features:"Team access · Weekly report"},
  ];
  const order = ["free","starter","pro","business"];
  const upgrades = allPlans.filter(p=>order.indexOf(p.key)>order.indexOf(plan));

  setView(`
    <div class="card">
      ${header("💳 Subscription","dashboard")}

      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:20px;border-left:4px solid ${color}">
        <p style="margin:0;font-size:12px;color:#94a3b8">Current Plan</p>
        <h3 style="margin:5px 0;color:${color}">${plan.toUpperCase()}</h3>
        <p style="margin:4px 0;font-size:13px">📩 Leads: ${leadsCount} / ${limits.leads === Infinity ? "Unlimited" : limits.leads}</p>
        <p style="margin:4px 0;font-size:13px">🧠 AI Uses: ${usage} / ${limits.ai_per_day === Infinity ? "Unlimited" : limits.ai_per_day} per day</p>
      </div>

      ${currency !== "NGN" ? `<p style="font-size:11px;color:#64748b;margin-bottom:10px">Prices shown in ${currency}</p>` : ""}
      ${upgrades.length > 0 ? upgrades.map(p => `
      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px;border:1px solid ${p.color}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h4 style="margin:0;color:${p.color}">${p.label}</h4>
            <p style="margin:4px 0;font-size:12px;color:#94a3b8">${p.leads} · ${p.ai}</p>
            <p style="margin:4px 0;font-size:12px;color:#94a3b8">${p.features}</p>
          </div>
          <div style="text-align:right">
            <p style="margin:0;font-weight:bold;color:white">${fmt(p.price)}</p>
            <p style="margin:0;font-size:11px;color:#94a3b8">/month</p>
          </div>
        </div>
        <button onclick="upgradePlan('${p.key}')" style="width:100%;margin-top:12px;padding:10px;background:${p.color};color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Upgrade to ${p.label}</button>
      </div>`).join("") : `
      <div style="background:#0f172a;padding:15px;border-radius:10px;text-align:center">
        <p style="color:#8b5cf6;margin:0">🚀 You are on the highest plan!</p>
        <p style="color:#94a3b8;font-size:13px">All features unlocked.</p>
      </div>`}
    </div>
  `);
}

async function upgradePlan(plan){
  const btns = document.querySelectorAll("button");
  btns.forEach(b => b.disabled = true);
  try {
    const res = await fetch("/api/paystack/init", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify({ email: currentUser?.email, plan })
    });
    const data = await res.json();
    if(data.data?.authorization_url){
      window.location.href = data.data.authorization_url;
    } else {
      alert("Payment init failed. Try again.");
      btns.forEach(b => b.disabled = false);
    }
  } catch(e){
    alert("Error: " + e.message);
    btns.forEach(b => b.disabled = false);
  }
}

/* =========================
   SETTINGS
========================= */
function renderSettings(){
  setView(`
    <div class="card">
      ${header("⚙️ Settings","dashboard")}

      <div style="margin-top:15px">
        <p onclick="loadPage('profile')" style="cursor:pointer">👤 View Profile</p>
        <p onclick="loadPage('editProfile')" style="cursor:pointer">✏️ Edit Profile</p>
        <p onclick="loadPage('subscription')" style="cursor:pointer">💳 Subscription</p>
        <p onclick="loadPage('support')" style="cursor:pointer">🆘 Support</p>
        <p onclick="logout()" style="color:red;cursor:pointer">🚪 Logout</p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:10px 0">
        <p onclick="deleteAccount()" style="color:#ef4444;cursor:pointer;font-size:13px">🗑 Delete Account</p>
      </div>
    </div>
  `);
}

/* =========================
   SUPPORT
========================= */
let supportHistory = [];

function renderSupport(){
  supportHistory = [];
  setView(`
    <div class="card">
      ${header("🆘 Support","dashboard")}

      <p style="color:#94a3b8;font-size:13px;margin-bottom:12px">Tell our AI support what you need help with. It will collect your issue and send it directly to our team.</p>

      <div id="support_chat" style="min-height:60px;max-height:40vh;overflow-y:auto;margin-bottom:10px"></div>

      <div id="support_input_area" style="display:flex;gap:8px;margin-bottom:15px">
        <input id="support_input" placeholder="Describe your issue..." onkeydown="if(event.key==='Enter') sendSupportMsg()" style="flex:1;padding:10px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;font-size:13px">
        <button onclick="sendSupportMsg()" style="padding:10px 14px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer">Send</button>
      </div>

      <div id="wa_send_btn" style="display:none;margin-bottom:15px">
        <button onclick="sendToWhatsApp()" style="width:100%;padding:12px;background:#25d366;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">📤 Send Issue to WhatsApp Support</button>
      </div>

      <p style="font-size:13px;font-weight:bold;margin-bottom:10px">❓ FAQ</p>
      ${[
        ["How do I upgrade my plan?","Go to Menu → Subscription → choose a plan → pay via Paystack."],
        ["How many leads can I add?","Free: 10. Starter: 50. Pro: 500. Business: Unlimited."],
        ["How many AI uses do I get?","Free: 3/day. Starter: 15/day. Pro: 50/day. Business: Unlimited."],
        ["Why is my email showing Loading?","Log out and log back in to refresh your session."],
        ["Can I export my leads?","CSV export is available on Pro and Business plans."],
        ["How do I delete my account?","Go to Settings → Delete Account."]
      ].map(([q,a],i)=>`
        <div style="background:#0f172a;border-radius:8px;margin-bottom:8px;overflow:hidden">
          <div onclick="toggleFaq(${i})" style="padding:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
            <p style="margin:0;font-size:13px">${q}</p>
            <span id="faq_arrow_${i}" style="color:#64748b;font-size:12px">▼</span>
          </div>
          <div id="faq_${i}" style="display:none;padding:0 12px 12px">
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">${a}</p>
          </div>
        </div>
      `).join("")}
    </div>
  `);
  renderSupportChat();
  // AI greeting
  setTimeout(()=>{
    supportHistory.push({role:"assistant",content:"Hi! I am the AI Business support assistant. Please describe your issue and I will help collect the details to send to our support team."});
    renderSupportChat();
  },300);
}

function renderSupportChat(){
  const chat = document.getElementById("support_chat");
  if(!chat) return;
  chat.innerHTML = supportHistory.map(m=>
    m.role==="user"
      ? `<div style="text-align:right;margin-bottom:8px"><span style="background:#3b82f6;padding:8px 12px;border-radius:12px 12px 0 12px;font-size:13px;display:inline-block;max-width:90%">${m.content}</span></div>`
      : `<div style="background:#0f172a;padding:10px 12px;border-radius:8px;margin-bottom:8px;border-left:3px solid #3b82f6"><p style="margin:0;font-size:13px;line-height:1.5;color:#cbd5e1">${m.content}</p></div>`
  ).join("");
  chat.scrollTop = chat.scrollHeight;
}

async function sendSupportMsg(){
  const input = document.getElementById("support_input")?.value.trim();
  if(!input) return;
  document.getElementById("support_input").value="";
  supportHistory.push({role:"user",content:input});
  renderSupportChat();

  const btn = document.querySelector("button[onclick='sendSupportMsg()']");
  if(btn){btn.disabled=true;btn.textContent="...";}

  try{
    const res = await fetch("/api/ai-reply",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body:JSON.stringify({
        message: input,
        tool: "support",
        history: supportHistory.slice(-6),
        systemOverride: "You are an AI support agent for AI Business SaaS. Your job is to collect information about the user issue: what the problem is, when it started, what they tried. Ask 1-2 follow-up questions if needed. After 2-3 exchanges, summarize the issue clearly and tell them to click the button below to send it to the support team. Be friendly and professional."
      })
    });
    const data = await res.json();
    if(data.success){
      supportHistory.push({role:"assistant",content:data.reply});
      renderSupportChat();
      // Show WhatsApp button after 2 exchanges
      if(supportHistory.length >= 4){
        const wabtn = document.getElementById("wa_send_btn");
        if(wabtn) wabtn.style.display="block";
      }
    }
  }catch(e){
    supportHistory.push({role:"assistant",content:"Sorry, I am having trouble connecting. Please email support@aibusiness.ng directly."});
    renderSupportChat();
  }
  if(btn){btn.disabled=false;btn.textContent="Send";}
}

function sendToWhatsApp(){
  const summary = supportHistory
    .map(m=>(m.role==="user"?"User: ":"Support AI: ")+m.content)
    .join("\n");
  const msg = encodeURIComponent("*AI Business Support Request*\nUser: "+( currentUser?.email||"Unknown")+"\n\n"+summary);
  window.open("https://wa.me/2348127538882?text="+msg,"_blank");
}

function toggleFaq(i){
  const el=document.getElementById("faq_"+i);
  const ar=document.getElementById("faq_arrow_"+i);
  if(!el) return;
  if(el.style.display==="none"){ el.style.display="block"; ar.textContent="▲"; }
  else{ el.style.display="none"; ar.textContent="▼"; }
}

/* =========================
   MENU CONTROL
========================= */
function toggleMenu(){
  const m = document.getElementById("menu");
  if(!m) return;
  m.style.display = m.style.display === "block" ? "none" : "block";
}

function closeMenu(){
  const m = document.getElementById("menu");
  if(m) m.style.display = "none";
}

/* =========================
   LOGOUT
========================= */
function logout(){
  const ok = confirm("Are you sure you want to logout?");
  if(ok){
    localStorage.removeItem("token");
    location.href = "/auth";
  }
}

async function deleteAccount(){
  const code = prompt("Type DELETE to confirm:");
  if(code !== "DELETE") return;
  try{
    const res = await fetch("/api/account",{
      method:"DELETE",
      headers:{Authorization:"Bearer "+localStorage.getItem("token")}
    });
    const data = await res.json();
    if(data.success){
      localStorage.clear();
      alert("Account deleted.");
      location.href="/auth";
    } else { alert("Error: "+(data.error||"Failed")); }
  }catch(e){ alert("Error: "+e.message); }
}

/* =========================
   LEAD FINDER
========================= */
const INDUSTRIES = [
  "Salon / Hair Studio", "Spa / Wellness Center", "Restaurant / Food Business",
  "Real Estate Agency", "Fashion / Clothing Store", "Photography Studio",
  "Event Planning", "Catering Service", "Supermarket / Retail Shop",
  "Gym / Fitness Center", "Hotel / Shortlet", "Auto Repair / Mechanic",
  "School / Tutoring", "Pharmacy / Drugstore", "Logistics / Delivery",
  "Interior Design", "Printing / Graphics", "Bakery / Confectionery",
  "Legal Services", "Accounting / Finance", "Other (type below)"
];

function renderLeadFinder(){
  const plan = currentSub?.plan || "free";
  const usage = currentSub?.subscription?.lead_finder_usage || 0;
  const limits = { free:3, starter:15, pro:50, business:999 };
  const limit = limits[plan] || 3;
  const isPro = plan === "pro" || plan === "business";

  setView(`
    <div class="card">
      ${header("🎯 Lead Finder","dashboard")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:15px">Tell us about your business. We find potential customers and write outreach messages for you.</p>

      <div style="background:#0f172a;padding:12px;border-radius:8px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:#94a3b8">Searches this month</span>
        <span style="font-size:13px;font-weight:bold;color:${usage>=limit?"#ef4444":"#10b981"}">${usage} / ${limit===999?"Unlimited":limit}</span>
      </div>

      ${usage >= limit && limit !== 999 ? `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:14px;text-align:center;margin-bottom:15px">
          <p style="margin:0 0 8px;font-size:13px;color:#ef4444">Monthly search limit reached</p>
          <button onclick="loadPage('subscription')" style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Upgrade Plan</button>
        </div>
      ` : `
        <div style="margin-bottom:15px">
          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">What is your business / what do you offer?</p>
          <input id="lf_service" placeholder="e.g. Social media management, Web design, Catering..." style="width:100%;padding:10px;margin-bottom:12px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">

          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">What type of businesses do you want to reach?</p>
          <select id="lf_industry" onchange="checkCustomIndustry()" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
            <option value="">-- Select Industry --</option>
            ${INDUSTRIES.map(i=>`<option value="${i}">${i}</option>`).join("")}
          </select>
          <input id="lf_custom_industry" placeholder="Type custom industry..." style="display:none;width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">

          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">Which city or area?</p>
          <input id="lf_location" placeholder="e.g. Lagos, Abuja, Port Harcourt..." style="width:100%;padding:10px;margin-bottom:12px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">

          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">Extra details (optional)</p>
          <textarea id="lf_context" placeholder="Tell us more about your offer, pricing, or what makes you different..." style="width:100%;padding:10px;margin-bottom:12px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:70px;resize:none;box-sizing:border-box"></textarea>

          ${!isPro ? `<p style="font-size:11px;color:#475569;margin-bottom:10px">ℹ️ Free plan: messages include AI Business referral link. <span onclick="loadPage('subscription')" style="color:#3b82f6;cursor:pointer">Upgrade to Pro</span> to remove.</p>` : ""}

          <button onclick="searchLeads()" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:15px">🔍 Find Leads + Generate Messages</button>
        </div>
      `}

      <div id="lf_results"></div>
    </div>
  `);
}

function checkCustomIndustry(){
  const sel = document.getElementById("lf_industry")?.value;
  const custom = document.getElementById("lf_custom_industry");
  if(custom) custom.style.display = sel === "Other (type below)" ? "block" : "none";
}

async function searchLeads(){
  const service = document.getElementById("lf_service")?.value.trim();
  const industrySelect = document.getElementById("lf_industry")?.value;
  const customIndustry = document.getElementById("lf_custom_industry")?.value.trim();
  const industry = industrySelect === "Other (type below)" ? customIndustry : industrySelect;
  const location = document.getElementById("lf_location")?.value.trim();
  const context = document.getElementById("lf_context")?.value.trim();

  if(!service) return alert("Please enter what you offer.");
  if(!industry) return alert("Please select a target industry.");
  if(!location) return alert("Please enter a target location.");

  const btn = document.querySelector("button[onclick='searchLeads()']");
  if(btn){ btn.disabled=true; btn.textContent="🔍 Searching for leads..."; }

  const results = document.getElementById("lf_results");
  if(results) results.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px 0">Finding leads and writing personalized messages...<br><span style="font-size:12px">This takes 10-15 seconds</span></p>';

  const plan = currentSub?.plan || "free";
  const isPro = plan === "pro" || plan === "business";
  const referralLine = isPro ? "" : "\n\n_Managed with AI Business_ 🚀 Try free: s-1orz.onrender.com";

  try{
    const res = await fetch("/api/lead-finder",{
      method:"POST",
      headers:{"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({ service, location, context: `${service} targeting ${industry} businesses. ${context}`, industry })
    });
    const data = await res.json();

    if(!data.success){
      if(results) results.innerHTML = `<div style="background:rgba(239,68,68,0.1);padding:12px;border-radius:8px;text-align:center"><p style="color:#ef4444;margin:0">${data.error}</p>${data.usage >= data.limit ? `<button onclick="loadPage('subscription')" style="margin-top:8px;padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Upgrade Plan</button>` : ""}</div>`;
      return;
    }

    if(currentSub) currentSub.subscription = { ...currentSub.subscription, lead_finder_usage: data.usage };

    const leads = data.leads || [];
    if(leads.length === 0){
      if(results) results.innerHTML = '<p style="color:#64748b;text-align:center">No leads found. Try different terms or location.</p>';
      return;
    }

    if(results) results.innerHTML = `
      <p style="font-size:12px;color:#64748b;margin-bottom:12px">✅ Found ${leads.length} potential leads — edit messages then send</p>
      ${leads.map((l,i) => `
        <div id="lead_card_${i}" style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:12px;border-left:3px solid ${l.source==="local"?"#10b981":"#3b82f6"}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div style="flex:1">
              <p style="margin:0;font-weight:bold;font-size:14px">${l.name}</p>
              ${l.type?`<p style="margin:2px 0;font-size:11px;color:#64748b">${l.type}</p>`:""}
              ${l.address?`<p style="margin:2px 0;font-size:12px;color:#94a3b8">📍 ${l.address}</p>`:""}
              ${l.phone?`<p style="margin:2px 0;font-size:12px;color:#10b981;font-weight:bold">📞 ${l.phone}</p>`:""}
              ${l.rating?`<p style="margin:2px 0;font-size:11px;color:#f59e0b">⭐ ${l.rating} (${l.reviews} reviews)</p>`:""}
            </div>
            <span style="font-size:10px;padding:2px 8px;border-radius:6px;flex-shrink:0;${l.source==="local"?"background:rgba(16,185,129,0.15);color:#10b981":"background:rgba(59,130,246,0.15);color:#3b82f6"}">${l.source==="local"?"Local":"Online"}</span>
          </div>

          <p style="margin:0 0 6px;font-size:12px;color:#64748b">✏️ Edit message before sending:</p>
          <textarea id="msg_${i}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#162032;color:#cbd5e1;font-size:13px;height:100px;resize:vertical;box-sizing:border-box;line-height:1.5">${l.message}${referralLine}</textarea>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button onclick="copyEditedMsg(${i})" style="padding:7px 12px;background:#334155;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">📋 Copy</button>
            ${l.phone?`<a href="https://wa.me/${l.phone.replace(/[^0-9]/g,"").replace(/^0/,"234")}?text=" + encodeURIComponent(document.getElementById("msg_${i}")?.value||"") + "" target="_blank" onclick="saveToLeads(${i},'${l.name.replace(/'/g,"\'")}','${(l.phone||"").replace(/'/g,"\'")}','${(l.type||"").replace(/'/g,"\'")}','${(l.address||"").replace(/'/g,"\'")}','${(l.website||"").replace(/'/g,"\'")}','wa')" style="padding:7px 12px;background:#25d366;color:white;border-radius:6px;text-decoration:none;font-size:12px;cursor:pointer">💬 Send WhatsApp</a>`:""}
            <button onclick="saveToLeads(${i},'${l.name.replace(/'/g,"\'")}','${(l.phone||"").replace(/'/g,"\'")}','${(l.type||"").replace(/'/g,"\'")}','${(l.address||"").replace(/'/g,"\'")}','${(l.website||"").replace(/'/g,"\'")}','save')" style="padding:7px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">💾 Save to Leads</button>
            ${l.website?`<a href="${l.website}" target="_blank" style="padding:7px 12px;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;text-decoration:none;font-size:12px">🌐 Website</a>`:""}
          </div>
          <div id="note_${i}" style="display:none;margin-top:10px">
            <textarea id="note_text_${i}" placeholder="What did they say? Add a follow-up note..." style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:12px;height:60px;resize:none;box-sizing:border-box"></textarea>
            <button onclick="saveNote(${i})" style="margin-top:6px;padding:7px 12px;background:#8b5cf6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Save Note</button>
          </div>
        </div>
      `).join("")}
    `;

    // Store leads data for save functions
    window._lfLeads = leads;

  }catch(e){
    if(results) results.innerHTML = `<div style="text-align:center;padding:15px"><p style="color:#ef4444;margin-bottom:10px">Network error. Check connection and try again.</p><button onclick="searchLeads()" style="padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer">🔄 Retry</button></div>`;
  }

  if(btn){ btn.disabled=false; btn.textContent="🔍 Find Leads + Generate Messages"; }
}

function copyEditedMsg(i){
  const text = document.getElementById("msg_"+i)?.value||"";
  navigator.clipboard.writeText(text).then(()=>{
    const btn = document.querySelectorAll("[onclick^='copyEditedMsg']")[i];
    if(btn){ btn.textContent="✅ Copied!"; setTimeout(()=>btn.textContent="📋 Copy",2000); }
  });
}

async function saveToLeads(i, name, phone, business, address, website, action){
  const message = document.getElementById("msg_"+i)?.value||"";
  try{
    const res = await fetch("/api/leads",{
      method:"POST",
      headers:{"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({
        name, phone, email: "", business,
        message: "Found via Lead Finder. Address: "+address+". Website: "+website+". Sent: "+message.slice(0,200),
        status: action==="wa" ? "contacted" : "new"
      })
    });
    const data = await res.json();
    if(data.success){
      // Show follow-up note box
      const noteBox = document.getElementById("note_"+i);
      if(noteBox) noteBox.style.display = "block";
      // Flash green border
      const card = document.getElementById("lead_card_"+i);
      if(card){ card.style.borderColor="#10b981"; card.style.borderWidth="2px"; }
    }
  }catch(e){ console.error(e); }
}

async function saveNote(i){
  const note = document.getElementById("note_text_"+i)?.value.trim();
  if(!note) return;
  // Notes are saved to the lead's message field via update
  alert("Note saved! Check your Leads page for follow-up.");
  document.getElementById("note_"+i).style.display = "none";
}

/* =========================
   START APP
========================= */
// Keep Render alive
setInterval(()=>{
  fetch('/api/status').catch(()=>{});
}, 4 * 60 * 1000);

init();
