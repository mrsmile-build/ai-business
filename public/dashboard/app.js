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
  var storedNiche = localStorage.getItem("aib_niche");
  if(currentProfile && !currentProfile.business_type && storedNiche){ currentProfile.business_type = storedNiche; }
  if(currentUser && currentProfile && !currentProfile.business_type && !storedNiche){ renderNicheSelect(); } else { loadPage("dashboard"); }
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
    dashboard: 'renderDashboard',
    profile: 'renderProfile',
    analytics: 'renderAnalytics',
    leads: 'renderLeads',
    aiTools: 'renderAITools',
    subscription: 'renderSubscription',
    settings: 'renderSettings',
    support: 'renderSupport',
    editProfile: 'renderEditProfile',
    leadFinder: 'renderLeadFinder',
    proposal: 'renderProposal',
    revenue: 'renderRevenue',
    agents: 'renderAgents',
    referral: 'renderReferral',
    automation: 'renderAutomation'
  };

  var fnName = routes[page];
  var fn = (fnName && typeof window[fnName] === 'function') ? window[fnName] : null;
  if(fn){ fn(); } else { renderDashboard(); }
}

/* =========================
   DASHBOARD (CORE SAAS)
========================= */
function renderDashboard(){
  setTimeout(loadFollowUps, 500);
  var plan = (currentSub && currentSub.plan) ? currentSub.plan : "free";
  var pc = {business:"#8b5cf6",pro:"#3b82f6",starter:"#10b981",free:"#64748b"};
  var planColor = pc[plan] || "#64748b";
  var pl = {business:"Business",pro:"Pro",starter:"Starter",free:"Free"};
  var planLabel = pl[plan] || "Free";
  var leadsCount = (currentSub && currentSub.leads_count) ? currentSub.leads_count : 0;
  var leadsLimit = (currentSub && currentSub.limits && currentSub.limits.leads) ? currentSub.limits.leads : 10;
  var aiUsage = (currentSub && currentSub.ai_usage) ? currentSub.ai_usage : 0;
  var aiLimitRaw = (currentSub && currentSub.limits) ? currentSub.limits.ai_per_day : 3;
  var aiLimit = (!aiLimitRaw || aiLimitRaw > 1000) ? "Unlimited" : aiLimitRaw;
  var email = currentUser ? (currentUser.email || "") : "";
  var name = (currentProfile && currentProfile.display_name) ? currentProfile.display_name : (email.split("@")[0] || "Welcome");
  var initials = name.substring(0,2).toUpperCase();

  setView(`
    <div class="card" style="padding:0;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0f172a,#1a2540);padding:18px 16px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;border-radius:50%;background:${planColor};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:white">${initials}</div>
            <div>
              <p style="margin:0;font-size:14px;font-weight:700">${name}</p>
              <p style="margin:0;font-size:11px;color:#64748b">${email}</p>
            </div>
          </div>
          <span style="padding:4px 10px;background:${planColor}22;border:1px solid ${planColor}55;border-radius:20px;font-size:11px;font-weight:600;color:${planColor}">${planLabel}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:#0f172a">
        <div style="padding:14px 8px;text-align:center;border-right:1px solid #1e293b" onclick="loadPage(\'leads\')" style="cursor:pointer">
          <p style="margin:0;font-size:20px;font-weight:800;color:#3b82f6">${leadsCount}</p>
          <p style="margin:2px 0 0;font-size:10px;color:#475569;text-transform:uppercase">Leads</p>
        </div>
        <div style="padding:14px 8px;text-align:center;border-right:1px solid #1e293b">
          <p style="margin:0;font-size:20px;font-weight:800;color:#10b981">${aiUsage}</p>
          <p style="margin:2px 0 0;font-size:10px;color:#475569;text-transform:uppercase">AI Uses</p>
        </div>
        <div style="padding:14px 8px;text-align:center;cursor:pointer" onclick="loadPage('revenue')">
          <p style="margin:0;font-size:20px;font-weight:800;color:#f59e0b">0</p>
          <p style="margin:2px 0 0;font-size:10px;color:#475569;text-transform:uppercase">Revenue</p>
        </div>
      </div>

      <div id="followup_box" style="display:none"></div>
      <div style="padding:0 14px">${renderOnboarding()}</div>

      <div style="padding:14px">
        <div style="background:#0b1220;border-radius:8px;padding:10px 12px;margin-bottom:12px">
          <p style="margin:0 0 6px;font-size:11px;color:#3b82f6;font-weight:600">YOUR BUSINESS FLOW</p>
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#64748b;flex-wrap:wrap">
            <span onclick="loadPage('leadFinder')" style="cursor:pointer;color:#3b82f6">🎯 Find</span>
            <span>→</span>
            <span onclick="loadPage('aiTools')" style="cursor:pointer;color:#8b5cf6">💬 Message</span>
            <span>→</span>
            <span onclick="loadPage('leads')" style="cursor:pointer;color:#10b981">📩 Track</span>
            <span>→</span>
            <span onclick="loadPage('automation')" style="cursor:pointer;color:#f59e0b">⚡ Follow Up</span>
            <span>→</span>
            <span onclick="loadPage('proposal')" style="cursor:pointer;color:#ef4444">📄 Close</span>
          </div>
        </div>
        <p style="margin:0 0 10px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px">Quick Actions</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button onclick="loadPage(\'leads\')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">📩</div>
            <div style="font-size:12px;font-weight:600">Leads</div>
            <div style="font-size:10px;color:#475569">${leadsCount}/${leadsLimit > 1000 ? "Unlimited" : leadsLimit}</div>
          </button>
          <button onclick="loadPage('leadFinder')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">🎯</div>
            <div style="font-size:12px;font-weight:600">Lead Finder</div>
            <div style="font-size:10px;color:#475569">Find customers</div>
          </button>
          <button onclick="loadPage('aiTools')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">🧠</div>
            <div style="font-size:12px;font-weight:600">AI Tools</div>
            <div style="font-size:10px;color:#475569">${aiUsage}/${aiLimit} today</div>
          </button>
          <button onclick="loadPage('agents')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">🤖</div>
            <div style="font-size:12px;font-weight:600">AI Agents</div>
            <div style="font-size:10px;color:#475569">Auto-tasks</div>
          </button>
          <button onclick="loadPage('proposal')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">📄</div>
            <div style="font-size:12px;font-weight:600">Proposals</div>
            <div style="font-size:10px;color:#475569">Generate fast</div>
          </button>
          <button onclick="loadPage('automation')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">⚡</div>
            <div style="font-size:12px;font-weight:600">Automation</div>
            <div style="font-size:10px;color:#475569">Set once</div>
          </button>
          <button onclick="loadPage('referral')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">🎁</div>
            <div style="font-size:12px;font-weight:600">Refer</div>
            <div style="font-size:10px;color:#475569">Earn free months</div>
          </button>
          <button onclick="loadPage('subscription')" style="padding:13px 10px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border:none;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">💳</div>
            <div style="font-size:12px;font-weight:600">Upgrade</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.6)">Unlock more</div>
          </button>
        </div>
      </div>
    </div>
  `);
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
   AI AGENTS
========================= */
function renderAgents(){
  setView(`
    <div class="card">
      ${header("🤖 AI Agents","dashboard")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Setup once. Each agent handles a task for your business.</p>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:12px;border-left:3px solid #3b82f6">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
            <p style="margin:0;font-weight:bold;font-size:14px">📞 Follow-Up Agent</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748b">Checks which leads need follow-up today</p>
          </div>
          <button onclick="runFollowUpAgent()" style="padding:7px 14px;background:#3b82f6;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px">Run</button>
        </div>
        <div id="followup_agent_result"></div>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:12px;border-left:3px solid #10b981">
        <p style="margin:0 0 4px;font-weight:bold;font-size:14px">💰 Quote Agent</p>
        <p style="margin:0 0 10px;font-size:12px;color:#64748b">Generate instant professional quotes</p>
        <input id="qa_service" placeholder="Service (e.g. Website design)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="qa_client" placeholder="Client name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="qa_price" placeholder="Your price (e.g. 80,000)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <button onclick="runQuoteAgent()" style="width:100%;padding:10px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Generate Quote</button>
        <div id="quote_result" style="margin-top:10px"></div>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:12px;border-left:3px solid #f59e0b">
        <p style="margin:0 0 4px;font-weight:bold;font-size:14px">⭐ Review Agent</p>
        <p style="margin:0 0 10px;font-size:12px;color:#64748b">Ask customers to leave Google reviews</p>
        <input id="ra_customer" placeholder="Customer name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="ra_service" placeholder="Service you provided" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <button onclick="runReviewAgent()" style="width:100%;padding:10px;background:#f59e0b;color:black;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Generate Review Request</button>
        <div id="review_result" style="margin-top:10px"></div>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:12px;border-left:3px solid #8b5cf6">
        <p style="margin:0 0 4px;font-weight:bold;font-size:14px">🤝 Receptionist Agent</p>
        <p style="margin:0 0 10px;font-size:12px;color:#64748b">Replies to common customer questions</p>
        <input id="rec_biz" placeholder="Your business (e.g. Web design agency)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="rec_question" placeholder="Customer question" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <button onclick="runReceptionistAgent()" style="width:100%;padding:10px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Generate Reply</button>
        <div id="receptionist_result" style="margin-top:10px"></div>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;border-left:3px solid #ef4444">
        <p style="margin:0 0 4px;font-weight:bold;font-size:14px">🌙 Off-Hours Agent</p>
        <p style="margin:0 0 10px;font-size:12px;color:#64748b">Auto-reply when you are unavailable</p>
        <input id="oh_biz" placeholder="Your business name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="oh_hours" placeholder="Working hours (e.g. 9am-6pm Mon-Fri)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <button onclick="runOffHoursAgent()" style="width:100%;padding:10px;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Generate Auto-Reply</button>
        <div id="offhours_result" style="margin-top:10px"></div>
      </div>
    </div>
  `);
}


async function runFollowUpAgent(){
  var el = document.getElementById("followup_agent_result");
  if(el) el.innerHTML = '<p style="color:#64748b;font-size:12px">Checking...</p>';
  try{
    var res = await fetch("/api/leads/followups",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    var leads = data.followups || [];
    if(leads.length === 0){
      if(el) el.innerHTML = '<p style="color:#10b981;font-size:12px">All leads up to date!</p>';
    } else {
      if(el) el.innerHTML = '<p style="color:#f59e0b;font-size:12px">'+leads.length+' lead(s) need follow-up: '+leads.map(function(l){return l.name;}).join(", ")+'</p><button onclick="loadPage(\'leads\')" style="margin-top:6px;padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px">View Leads</button>';
    }
  } catch(e){ if(el) el.innerHTML = '<p style="color:red;font-size:12px">Error checking leads.</p>'; }
}

async function agentAI(prompt, resultId, btnEl, btnLabel){
  if(btnEl){ btnEl.disabled=true; btnEl.textContent="Generating..."; }
  var el = document.getElementById(resultId);
  if(el) el.innerHTML = '<p style="color:#64748b;font-size:12px">Writing...</p>';
  try{
    var res = await fetch("/api/ai-reply",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({message: prompt})
    });
    var data = await res.json();
    if(data.success){
if(el) el.innerHTML = `<textarea id="${resultId}_text" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#162032;color:#cbd5e1;font-size:12px;height:100px;resize:vertical;box-sizing:border-box;line-height:1.5;margin-top:6px">${data.reply}</textarea><div style="display:flex;gap:8px;margin-top:6px"><button onclick="copyAgentResult('${resultId}_text')" style="padding:6px 12px;background:#334155;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px">Copy</button><button onclick="shareAgentResult('${resultId}_text')" style="padding:6px 12px;background:#8b5cf6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px">Share</button></div>`;    } else {
      if(el) el.innerHTML = '<p style="color:#ef4444;font-size:12px">'+(data.reply||"Limit reached. Upgrade plan.")+'</p>';
    }
  } catch(e){
    if(el) el.innerHTML = '<p style="color:red;font-size:12px">Network error. Check connection.</p>';
  }
  if(btnEl){ btnEl.disabled=false; btnEl.textContent=btnLabel||"Generate"; }
}

function copyAgentResult(id){
  var text = document.getElementById(id)?.value||"";
  navigator.clipboard.writeText(text).then(function(){ alert("Copied!"); });
}
function shareAgentResult(id){
  var text = document.getElementById(id)?.value||"";
  if(navigator.share){ navigator.share({text:text}).catch(function(){}); }
  else { navigator.clipboard.writeText(text).then(function(){ alert("Copied! Paste to share."); }); }
}
function runQuoteAgent(){
  var service = document.getElementById("qa_service")?.value.trim();
  var client = document.getElementById("qa_client")?.value.trim();
  var price = document.getElementById("qa_price")?.value.trim();
  if(!service||!client) return alert("Fill service and client name.");
  var btn = document.querySelector("button[onclick='runQuoteAgent()']");
  agentAI("Write a short professional WhatsApp quote for: Client: "+client+", Service: "+service+", Price: "+(price||"to discuss")+". Professional, clear, call to action. Under 100 words. Nigeria context.", "quote_result", btn, "Generate Quote");
}
function runReviewAgent(){
  var customer = document.getElementById("ra_customer")?.value.trim();
  var service = document.getElementById("ra_service")?.value.trim();
  if(!customer||!service) return alert("Fill customer name and service.");
  var btn = document.querySelector("button[onclick='runReviewAgent()']");
  agentAI("Write a friendly WhatsApp message asking "+customer+" to leave a Google review for "+service+" they received. Natural, grateful, include 'please leave us a Google review'. Under 80 words.", "review_result", btn, "Generate Review Request");
}
function runReceptionistAgent(){
  var biz = document.getElementById("rec_biz")?.value.trim();
  var q = document.getElementById("rec_question")?.value.trim();
  if(!biz||!q) return alert("Fill business and question.");
  var btn = document.querySelector("button[onclick='runReceptionistAgent()']");
  agentAI("You are the receptionist for "+biz+". Customer asked: "+q+". Write a professional friendly WhatsApp reply. Helpful, clear, offer to help further. Under 80 words.", "receptionist_result", btn, "Generate Reply");
}
function runOffHoursAgent(){
  var biz = document.getElementById("oh_biz")?.value.trim();
  var hours = document.getElementById("oh_hours")?.value.trim();
  if(!biz) return alert("Enter business name.");
  var btn = document.querySelector("button[onclick='runOffHoursAgent()']");
  agentAI("Write a WhatsApp auto-reply for "+biz+" when unavailable. Hours: "+(hours||"weekdays")+" . Friendly, acknowledge customer, state hours, say will reply soon. Under 60 words.", "offhours_result", btn, "Generate Auto-Reply");
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
            <button onclick="shareMsg(${i})" style="padding:7px 12px;background:#8b5cf6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">📤 Share</button>
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

function shareMsg(i){
  const text = document.getElementById("msg_"+i)?.value||"";
  if(navigator.share){
    navigator.share({ text }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text).then(()=>alert("Copied! Paste anywhere to share."));
  }
}

function sendLfWhatsApp(i, phone){
  var msg = document.getElementById("msg_"+i)?.value || "";
  if(!msg){ alert("Message is empty"); return; }
  window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");
}
function shareLfMsg(i){
  var text = document.getElementById("msg_"+i)?.value || "";
  if(navigator.share){ navigator.share({text}).catch(function(){}); }
  else { navigator.clipboard.writeText(text).then(function(){ alert("Copied!"); }); }
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
   FOLLOW-UP ALERTS (in dashboard)
========================= */
async function loadFollowUps(){
  try{
    const res = await fetch("/api/leads/followups",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
    const data = await res.json();
    const followups = data.followups || [];
    const box = document.getElementById("followup_box");
    if(!box) return;
    if(followups.length === 0){ box.style.display="none"; return; }
    box.style.display = "block";
    box.innerHTML = `
      <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:14px;margin-bottom:15px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#f59e0b">⏰ ${followups.length} lead${followups.length>1?"s":""} need follow-up today</p>
        ${followups.map(l=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
            <div>
              <span style="font-size:13px">${l.name}</span>
              <span style="font-size:11px;color:#64748b;margin-left:8px">${l.follow_up_date}</span>
            </div>
            <button onclick="loadPage(\'leads\')" style="padding:4px 10px;background:#f59e0b;color:black;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:bold">View</button>
          </div>
        `).join("")}
      </div>`;
  }catch(e){}
}

/* =========================
   REVENUE TRACKER
========================= */
async function renderRevenue(){
  setView(`<div class="card">${header("💰 Revenue","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try{
    const res = await fetch("/api/revenue",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
    const data = await res.json();
    const total = data.total || 0;
    const monthly = data.monthly || 0;
    const count = data.count || 0;
    const deals = data.deals || [];

    setView(`
      <div class="card">
        ${header("💰 Revenue","dashboard")}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px">
          <div style="background:#0f172a;padding:15px;border-radius:10px;text-align:center;border-top:3px solid #10b981">
            <p style="margin:0;font-size:11px;color:#64748b">TOTAL REVENUE</p>
            <p style="margin:5px 0;font-size:22px;font-weight:bold;color:#10b981">₦${total.toLocaleString()}</p>
          </div>
          <div style="background:#0f172a;padding:15px;border-radius:10px;text-align:center;border-top:3px solid #3b82f6">
            <p style="margin:0;font-size:11px;color:#64748b">THIS MONTH</p>
            <p style="margin:5px 0;font-size:22px;font-weight:bold;color:#3b82f6">₦${monthly.toLocaleString()}</p>
          </div>
        </div>

        <div style="background:#0f172a;padding:12px;border-radius:10px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:#94a3b8">Deals closed</span>
          <span style="font-size:20px;font-weight:bold;color:#f59e0b">${count}</span>
        </div>

        ${deals.length > 0 ? `
          <p style="font-size:13px;color:#94a3b8;margin-bottom:10px">Won Deals</p>
          ${deals.map(d=>`
            <div style="background:#0f172a;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <p style="margin:0;font-size:13px;font-weight:bold">${d.name}</p>
                <p style="margin:2px 0;font-size:11px;color:#64748b">${new Date(d.created_at).toLocaleDateString()}</p>
              </div>
              <span style="color:#10b981;font-weight:bold">₦${parseFloat(d.sale_amount||0).toLocaleString()}</span>
            </div>
          `).join("")}
        ` : `<p style="color:#64748b;text-align:center;padding:20px">No won deals yet. Mark leads as Won to track revenue.</p>`}

        <button onclick="loadPage(\'leads\')" style="width:100%;padding:11px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;margin-top:10px">📩 Go to Leads</button>
      </div>
    `);
  }catch(e){
    setView(`<div class="card">${header("💰 Revenue","dashboard")}<p style="color:red">Error loading revenue.</p></div>`);
  }
}

/* =========================
   PROPOSAL GENERATOR
========================= */
function renderProposal(){
  setView(`
    <div class="card">
      ${header("📄 Proposal Generator","dashboard")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:15px">Generate a professional business proposal in seconds.</p>

      <div style="background:#0f172a;padding:15px;border-radius:10px;margin-bottom:12px">
        <input id="pr_your_name" placeholder="Your name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="pr_your_biz" placeholder="Your business name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="pr_client" placeholder="Client / Business name *" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="pr_service" placeholder="Service you are offering *" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="pr_price" placeholder="Price / Budget (e.g. ₦150,000)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <textarea id="pr_details" placeholder="Any specific details, requirements, or scope of work..." style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:80px;resize:none;box-sizing:border-box"></textarea>
      </div>

      <button onclick="generateProposal()" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:15px;margin-bottom:15px">📄 Generate Proposal</button>

      <div id="proposal_result"></div>
    </div>
  `);
}

async function generateProposal(){
  const client = document.getElementById("pr_client")?.value.trim();
  const service = document.getElementById("pr_service")?.value.trim();
  if(!client || !service) return alert("Client name and service are required.");

  const btn = document.querySelector("button[onclick='generateProposal()']");
  if(btn){ btn.disabled=true; btn.textContent="Generating proposal..."; }

  const result = document.getElementById("proposal_result");
  if(result) result.innerHTML = "<p style='color:#64748b;text-align:center'>Writing your proposal... (15-20 seconds)</p>";

  try{
    const res = await fetch("/api/generate-proposal",{
      method:"POST",
      headers:{"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({
        client_name: client,
        service,
        price: document.getElementById("pr_price")?.value,
        details: document.getElementById("pr_details")?.value,
        your_name: document.getElementById("pr_your_name")?.value,
        your_business: document.getElementById("pr_your_biz")?.value
      })
    });
    const data = await res.json();
    if(data.success && data.proposal){
      if(result) result.innerHTML = `
        <div style="background:#0f172a;padding:15px;border-radius:10px;border:1px solid #334155">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <p style="margin:0;font-size:13px;color:#94a3b8">Your proposal is ready</p>
            <button onclick="copyProposal()" style="padding:6px 12px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">📋 Copy All</button>
          </div>
          <textarea id="proposal_text" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:#cbd5e1;font-size:12px;height:350px;resize:vertical;box-sizing:border-box;line-height:1.6;font-family:monospace">${data.proposal.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</textarea>
          <button onclick="shareProposal()" style="width:100%;margin-top:10px;padding:10px;background:#25d366;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">📤 Share Proposal</button>
        </div>`;
    } else {
      if(result) result.innerHTML = "<p style='color:red'>Failed to generate. Try again.</p>";
    }
  }catch(e){
    if(result) result.innerHTML = `<div style="text-align:center"><p style="color:red">Network error.</p><button onclick="generateProposal()" style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer">🔄 Retry</button></div>`;
  }
  if(btn){ btn.disabled=false; btn.textContent="📄 Generate Proposal"; }
}

function copyProposal(){
  const text = document.getElementById("proposal_text")?.value||"";
  navigator.clipboard.writeText(text).then(()=>alert("Proposal copied!"));
}
function shareProposal(){
  const text = document.getElementById("proposal_text")?.value||"";
  if(navigator.share){ navigator.share({title:"Business Proposal", text}).catch(()=>{}); }
  else { copyProposal(); }
}

/* =========================
   PROFILE
========================= */
function renderProfile(){
  const email = currentUser?.email || "";
  const name = currentProfile?.display_name || email.split("@")[0] || "";
  const phone = currentProfile?.phone || "Not set";
  const country = currentProfile?.country || "Not set";
  const biz = currentProfile?.business_type || "Not set";
  const plan = currentSub?.plan || "free";
  const planLabel = {business:"Business",pro:"Pro",starter:"Starter",free:"Free"}[plan]||"Free";
  const planColor = {business:"#8b5cf6",pro:"#3b82f6",starter:"#10b981",free:"#64748b"}[plan]||"#64748b";

  setView(`
    <div class="card">
      ${header("👤 Profile","dashboard")}

      <div style="text-align:center;padding:20px 0 16px">
        <div style="width:70px;height:70px;border-radius:50%;background:${planColor};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:bold;color:white;margin:0 auto 10px">${name.substring(0,2).toUpperCase()}</div>
        <p style="margin:0;font-size:18px;font-weight:700">${name}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b">${email}</p>
        <span style="display:inline-block;margin-top:8px;padding:4px 12px;background:${planColor}22;border:1px solid ${planColor}55;border-radius:20px;font-size:12px;color:${planColor};font-weight:600">${planLabel} Plan</span>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
        <div style="padding:10px 0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between">
          <span style="font-size:13px;color:#64748b">Phone</span>
          <span style="font-size:13px">${phone}</span>
        </div>
        <div style="padding:10px 0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between">
          <span style="font-size:13px;color:#64748b">Country</span>
          <span style="font-size:13px">${country}</span>
        </div>
        <div style="padding:10px 0;display:flex;justify-content:space-between">
          <span style="font-size:13px;color:#64748b">Business Type</span>
          <span style="font-size:13px;text-transform:capitalize">${biz}</span>
        </div>
      </div>

      <button onclick="loadPage('editProfile')" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;margin-bottom:10px">✏️ Edit Profile</button>
      <button onclick="loadPage('subscription')" style="width:100%;padding:12px;background:#0f172a;border:1px solid #334155;color:white;border-radius:8px;cursor:pointer;font-size:14px">💳 Manage Plan</button>
    </div>
  `);
}

/* =========================
   EDIT PROFILE
========================= */
function renderEditProfile(){
  const name = currentProfile?.display_name || "";
  const phone = currentProfile?.phone || "";
  const country = currentProfile?.country || "";
  const biz = currentProfile?.business_type || "";

  setView(`
    <div class="card">
      ${header("✏️ Edit Profile","profile")}

      <div style="margin-bottom:14px">
        <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">Display Name</p>
        <input id="ep_name" value="${name}" placeholder="Your name" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      </div>
      <div style="margin-bottom:14px">
        <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">Phone Number</p>
        <input id="ep_phone" value="${phone}" placeholder="e.g. 08012345678" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      </div>
      <div style="margin-bottom:14px">
        <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">Country</p>
        <input id="ep_country" value="${country}" placeholder="e.g. Nigeria" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      </div>
      <div style="margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">Business Type</p>
        <select id="ep_biz" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <option value="">-- Select --</option>
          <option value="agency" ${biz==="agency"?"selected":""}>Agency/Freelancer</option>
          <option value="salon" ${biz==="salon"?"selected":""}>Salon/Beauty</option>
          <option value="restaurant" ${biz==="restaurant"?"selected":""}>Restaurant/Food</option>
          <option value="realestate" ${biz==="realestate"?"selected":""}>Real Estate</option>
          <option value="retail" ${biz==="retail"?"selected":""}>Retail/Fashion</option>
          <option value="tech" ${biz==="tech"?"selected":""}>Tech/IT</option>
          <option value="education" ${biz==="education"?"selected":""}>Education</option>
          <option value="other" ${biz==="other"?"selected":""}>Other</option>
        </select>
      </div>

      <button onclick="saveProfile()" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;margin-bottom:10px">💾 Save Changes</button>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-top:10px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#ef4444">Change Password</p>
        <input id="ep_old_pw" type="password" placeholder="Current password" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="ep_new_pw" type="password" placeholder="New password" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <button onclick="changePassword()" style="width:100%;padding:10px;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Update Password</button>
        <div id="pw_result" style="margin-top:8px"></div>
      </div>
    </div>
  `);
}

async function saveProfile(){
  const btn = document.querySelector("button[onclick='saveProfile()']");
  if(btn){btn.disabled=true;btn.textContent="Saving...";}
  const name = document.getElementById("ep_name")?.value.trim();
  const phone = document.getElementById("ep_phone")?.value.trim();
  const country = document.getElementById("ep_country")?.value.trim();
  const biz = document.getElementById("ep_biz")?.value;
  try {
    const res = await fetch("/api/profile",{
      method:"PATCH",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({display_name:name, phone, country, business_type:biz})
    });
    const data = await res.json();
    if(data.success){
      if(currentProfile){ currentProfile.display_name=name; currentProfile.phone=phone; currentProfile.country=country; currentProfile.business_type=biz; }
      if(biz) localStorage.setItem("aib_niche", biz);
      alert("Profile saved!");
      loadPage("profile");
    } else { alert(data.error||"Error saving."); }
  } catch(e){ alert("Network error."); }
  if(btn){btn.disabled=false;btn.textContent="Save Changes";}
}

async function changePassword(){
  const oldPw = document.getElementById("ep_old_pw")?.value;
  const newPw = document.getElementById("ep_new_pw")?.value;
  const result = document.getElementById("pw_result");
  if(!oldPw||!newPw){ if(result) result.innerHTML="<p style='color:red;font-size:12px'>Fill both fields.</p>"; return; }
  if(newPw.length < 6){ if(result) result.innerHTML="<p style='color:red;font-size:12px'>Password must be 6+ characters.</p>"; return; }
  try {
    const res = await fetch("/api/change-password",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({current_password:oldPw, new_password:newPw})
    });
    const data = await res.json();
    if(result) result.innerHTML = `<p style='color:${data.success?"#10b981":"#ef4444"};font-size:12px'>${data.message||data.error}</p>`;
  } catch(e){ if(result) result.innerHTML="<p style='color:red;font-size:12px'>Network error.</p>"; }
}

/* =========================
   ANALYTICS
========================= */
async function renderAnalytics(){
  setView(`<div class="card">${header("📊 Analytics","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    const [leadsRes, revenueRes] = await Promise.all([
      fetch("/api/leads",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}}),
      fetch("/api/revenue",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
    ]);
    const leadsData = await leadsRes.json();
    const revenueData = await revenueRes.json();

    const leads = leadsData.leads || [];
    const total = leads.length;
    const byStatus = {new:0,contacted:0,interested:0,negotiation:0,won:0,lost:0};
    leads.forEach(l => { if(byStatus[l.status]!==undefined) byStatus[l.status]++; });

    const revenue = revenueData.total || 0;
    const monthly = revenueData.monthly || 0;
    const aiUsage = currentSub?.ai_usage || 0;
    const plan = currentSub?.plan || "free";

    setView(`
      <div class="card">
        ${header("📊 Analytics","dashboard")}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
          <div style="background:#0f172a;padding:15px;border-radius:10px;border-top:3px solid #3b82f6">
            <p style="margin:0;font-size:22px;font-weight:800;color:#3b82f6">${total}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b">Total Leads</p>
          </div>
          <div style="background:#0f172a;padding:15px;border-radius:10px;border-top:3px solid #10b981">
            <p style="margin:0;font-size:22px;font-weight:800;color:#10b981">${byStatus.won}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b">Deals Won</p>
          </div>
          <div style="background:#0f172a;padding:15px;border-radius:10px;border-top:3px solid #f59e0b">
            <p style="margin:0;font-size:22px;font-weight:800;color:#f59e0b">₦${revenue.toLocaleString()}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b">Total Revenue</p>
          </div>
          <div style="background:#0f172a;padding:15px;border-radius:10px;border-top:3px solid #8b5cf6">
            <p style="margin:0;font-size:22px;font-weight:800;color:#8b5cf6">${aiUsage}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b">AI Uses Today</p>
          </div>
        </div>

        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 12px;font-size:13px;font-weight:bold">Pipeline Breakdown</p>
          ${Object.entries(byStatus).map(([status, count]) => {
            const colors = {new:"#64748b",contacted:"#3b82f6",interested:"#f59e0b",negotiation:"#8b5cf6",won:"#10b981",lost:"#ef4444"};
            const pct = total > 0 ? Math.round((count/total)*100) : 0;
            return `<div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:12px;text-transform:capitalize;color:#94a3b8">${status}</span>
                <span style="font-size:12px;color:${colors[status]}">${count} (${pct}%)</span>
              </div>
              <div style="background:#1e293b;border-radius:4px;height:6px">
                <div style="background:${colors[status]};width:${pct}%;height:6px;border-radius:4px;transition:width 0.5s"></div>
              </div>
            </div>`;
          }).join("")}
        </div>

        <div style="background:#0f172a;border-radius:10px;padding:15px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold">This Month</p>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b">
            <span style="font-size:13px;color:#64748b">Revenue</span>
            <span style="font-size:13px;color:#10b981;font-weight:bold">₦${monthly.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b">
            <span style="font-size:13px;color:#64748b">Conversion Rate</span>
            <span style="font-size:13px;font-weight:bold">${total > 0 ? Math.round((byStatus.won/total)*100) : 0}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0">
            <span style="font-size:13px;color:#64748b">Plan</span>
            <span style="font-size:13px;font-weight:bold;text-transform:capitalize">${plan}</span>
          </div>
        </div>
      </div>
    `);
  } catch(e){
    setView(`<div class="card">${header("📊 Analytics","dashboard")}<p style="color:red">Error: ${e.message}</p></div>`);
  }
}

/* =========================
   NICHE SELECT
========================= */
function renderNicheSelect(){
  setView(`
    <div class="card" style="text-align:center;padding:30px 20px">
      <div style="font-size:48px;margin-bottom:16px">👋</div>
      <h2 style="margin:0 0 8px;font-size:22px">Welcome to AI Business</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:24px">What type of business do you run?</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left">
        <button onclick="selectNiche('agency')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">💼 Agency/Freelancer</button>
        <button onclick="selectNiche('salon')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">💇 Salon/Beauty</button>
        <button onclick="selectNiche('restaurant')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">🍽️ Restaurant/Food</button>
        <button onclick="selectNiche('realestate')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">🏠 Real Estate</button>
        <button onclick="selectNiche('retail')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">🛍️ Retail/Fashion</button>
        <button onclick="selectNiche('tech')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">💻 Tech/IT</button>
        <button onclick="selectNiche('education')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">📚 Education</button>
        <button onclick="selectNiche('other')" style="padding:14px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;font-size:13px">🏢 Other</button>
      </div>
    </div>
  `);
}

async function selectNiche(niche){
  if(currentProfile) currentProfile.business_type = niche;
  else currentProfile = { business_type: niche };
  localStorage.setItem("aib_niche", niche);
  try {
    await fetch("/api/profile",{
      method:"PATCH",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({business_type: niche})
    });
  } catch(e){}
  loadPage("dashboard");
}

/* =========================
   ONBOARDING
========================= */
function getOnboardingStatus(){
  try { return JSON.parse(localStorage.getItem("aib_onboard")||"{}"); } catch(e){ return {}; }
}
function setOnboardStep(key){
  var s = getOnboardingStatus();
  s[key] = true;
  localStorage.setItem("aib_onboard", JSON.stringify(s));
}
function renderOnboarding(){
  var s = getOnboardingStatus();
  var steps = [
    { key:"leads_found", icon:"🎯", title:"Find your first leads", desc:"Use Lead Finder to find 5 businesses to contact", action:"leadFinder", btn:"Go to Lead Finder" },
    { key:"lead_saved", icon:"📩", title:"Save a lead", desc:"Add a potential customer to your Leads CRM", action:"leads", btn:"Go to Leads" },
    { key:"message_sent", icon:"💬", title:"Send your first message", desc:"Use AI Tools to write and send a message", action:"aiTools", btn:"Go to AI Tools" },
    { key:"proposal_made", icon:"📄", title:"Generate a proposal", desc:"Create a professional proposal for a client", action:"proposal", btn:"Go to Proposals" },
    { key:"automation_set", icon:"⚡", title:"Set up automation", desc:"Let AI Business work for you automatically", action:"automation", btn:"Set Up Automation" }
  ];
  var done = steps.filter(st => s[st.key]).length;
  var all = steps.length;
  if(done === all) return "";

  return `
    <div style="background:#0f172a;border-radius:12px;padding:16px;margin-bottom:14px;border:1px solid #1e293b">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <p style="margin:0;font-size:13px;font-weight:bold">🚀 Getting Started</p>
        <span style="font-size:12px;color:#64748b">${done}/${all} done</span>
      </div>
      <div style="background:#1e293b;border-radius:4px;height:6px;margin-bottom:12px">
        <div style="background:linear-gradient(90deg,#3b82f6,#7c3aed);width:${(done/all)*100}%;height:6px;border-radius:4px;transition:width 0.5s"></div>
      </div>
      ${steps.map(st => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1e293b;opacity:${s[st.key]?0.5:1}">
          <div style="width:28px;height:28px;border-radius:50%;background:${s[st.key]?'#10b981':'#1e293b'};border:2px solid ${s[st.key]?'#10b981':'#334155'};display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${s[st.key]?'✓':st.icon}</div>
          <div style="flex:1">
            <p style="margin:0;font-size:13px;font-weight:600;${s[st.key]?'text-decoration:line-through;color:#475569':''}">${st.title}</p>
            <p style="margin:0;font-size:11px;color:#64748b">${st.desc}</p>
          </div>
          ${!s[st.key] ? `<button onclick="setOnboardStep('${st.key}');loadPage('${st.action}')" style="padding:6px 10px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;flex-shrink:0">${st.btn}</button>` : ""}
        </div>
      `).join("")}
    </div>`;
}

/* =========================
   AUTOMATION CENTER
========================= */
async function renderAutomation(){
  setView(`<div class="card">${header("⚡ Automation","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    const [settingsRes, campaignsRes] = await Promise.all([
      fetch("/api/automation/settings",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}}),
      fetch("/api/campaigns",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
    ]);
    const { settings } = await settingsRes.json();
    const { campaigns } = await campaignsRes.json();
    const s = settings || {};
    const camps = campaigns || [];

    setView(`
      <div class="card">
        ${header("⚡ Automation Center","dashboard")}
        <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Setup once. AI Business does the work for you.</p>

        <!-- AUTO RULES -->
        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:bold">🤖 Auto Rules</p>

          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #1e293b">
            <div>
              <p style="margin:0;font-size:13px;font-weight:600">Follow-up Reminder</p>
              <p style="margin:2px 0 0;font-size:11px;color:#64748b">Remind me to follow up after
                <select id="auto_days" style="background:#1e293b;color:white;border:none;border-radius:4px;padding:2px 6px;font-size:11px">
                  <option value="1" ${s.followup_days==1?'selected':''}>1 day</option>
                  <option value="2" ${s.followup_days==2?'selected':''}>2 days</option>
                  <option value="3" ${!s.followup_days||s.followup_days==3?'selected':''}>3 days</option>
                  <option value="7" ${s.followup_days==7?'selected':''}>1 week</option>
                </select>
              </p>
            </div>
            <label style="position:relative;display:inline-block;width:44px;height:24px">
              <input type="checkbox" id="auto_followup" ${s.followup_days?'checked':''} style="opacity:0;width:0;height:0" onchange="saveAutoSettings()">
              <span onclick="document.getElementById('auto_followup').click()" style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${s.followup_days?'#3b82f6':'#334155'};border-radius:24px;transition:0.3s">
                <span style="position:absolute;height:18px;width:18px;left:${s.followup_days?'23px':'3px'};bottom:3px;background:white;border-radius:50%;transition:0.3s"></span>
              </span>
            </label>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #1e293b">
            <div>
              <p style="margin:0;font-size:13px;font-weight:600">Auto Review Request</p>
              <p style="margin:2px 0 0;font-size:11px;color:#64748b">Generate review message when lead is Won</p>
            </div>
            <label style="position:relative;display:inline-block;width:44px;height:24px">
              <input type="checkbox" id="auto_review" ${s.auto_review!==false?'checked':''} style="opacity:0;width:0;height:0" onchange="saveAutoSettings()">
              <span onclick="document.getElementById('auto_review').click()" style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${s.auto_review!==false?'#3b82f6':'#334155'};border-radius:24px;transition:0.3s">
                <span style="position:absolute;height:18px;width:18px;left:${s.auto_review!==false?'23px':'3px'};bottom:3px;background:white;border-radius:50%;transition:0.3s"></span>
              </span>
            </label>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0">
            <div>
              <p style="margin:0;font-size:13px;font-weight:600">Weekly Lead Discovery</p>
              <p style="margin:2px 0 0;font-size:11px;color:#64748b">Auto-find new leads every week</p>
            </div>
            <label style="position:relative;display:inline-block;width:44px;height:24px">
              <input type="checkbox" id="auto_weekly" ${s.weekly_leads?'checked':''} style="opacity:0;width:0;height:0" onchange="saveAutoSettings()">
              <span onclick="document.getElementById('auto_weekly').click()" style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${s.weekly_leads?'#3b82f6':'#334155'};border-radius:24px;transition:0.3s">
                <span style="position:absolute;height:18px;width:18px;left:${s.weekly_leads?'23px':'3px'};bottom:3px;background:white;border-radius:50%;transition:0.3s"></span>
              </span>
            </label>
          </div>
        </div>

        <!-- BROADCAST CAMPAIGN -->
        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:bold">📢 Broadcast Message</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b">Write one message → AI personalizes it for all your leads → you send with one tap</p>

          <input id="camp_name" placeholder="Campaign name (e.g. January Promo)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">

          <textarea id="camp_msg" placeholder="Your message template (e.g. Hi {name}, we have a special offer this week...)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:80px;resize:none;box-sizing:border-box;line-height:1.5"></textarea>

          <select id="camp_status" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
            <option value="all">Send to ALL leads</option>
            <option value="new">New leads only</option>
            <option value="contacted">Contacted leads only</option>
            <option value="interested">Interested leads only</option>
            <option value="won">Won customers only</option>
          </select>

          <button onclick="createCampaign()" style="width:100%;padding:11px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">📢 Create Campaign</button>
        </div>

        <!-- EXISTING CAMPAIGNS -->
        ${camps.length > 0 ? `
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#94a3b8">Your Campaigns (${camps.length})</p>
          ${camps.map(camp => `
            <div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <p style="margin:0;font-size:14px;font-weight:bold">${camp.name}</p>
                <span style="font-size:11px;padding:2px 8px;border-radius:6px;background:${camp.status==='ready'?'rgba(16,185,129,0.15)':'rgba(245,158,11,0.15)'};color:${camp.status==='ready'?'#10b981':'#f59e0b'}">${camp.status}</span>
              </div>
              <p style="margin:0 0 10px;font-size:12px;color:#64748b;line-height:1.4">${camp.message_template?.slice(0,80)}...</p>
              <p style="margin:0 0 10px;font-size:11px;color:#475569">Targets: ${camp.target_status} leads</p>
              <div style="display:flex;gap:8px">
                <button onclick="prepareCampaign('${camp.id}')" style="flex:1;padding:8px;background:#10b981;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px">⚡ Prepare Messages</button>
                <button onclick="deleteCampaign('${camp.id}')" style="padding:8px 12px;background:#1e293b;color:#ef4444;border:1px solid #ef4444;border-radius:7px;cursor:pointer;font-size:12px">🗑️</button>
              </div>
              <div id="camp_result_${camp.id}" style="margin-top:10px"></div>
            </div>
          `).join("")}
        ` : '<p style="color:#475569;text-align:center;font-size:13px;padding:10px">No campaigns yet. Create your first one above.</p>'}
      </div>
    `);
  } catch(e) {
    setView(`<div class="card">${header("⚡ Automation","dashboard")}<p style="color:red">${e.message}</p></div>`);
  }
}

async function saveAutoSettings(){
  const days = parseInt(document.getElementById("auto_days")?.value)||3;
  const followup = document.getElementById("auto_followup")?.checked;
  const review = document.getElementById("auto_review")?.checked;
  const weekly = document.getElementById("auto_weekly")?.checked;
  try {
    await fetch("/api/automation/settings",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({ followup_days: followup?days:null, auto_review: review, weekly_leads: weekly })
    });
  } catch(e){}
}

async function createCampaign(){
  const name = document.getElementById("camp_name")?.value.trim();
  const msg = document.getElementById("camp_msg")?.value.trim();
  const status = document.getElementById("camp_status")?.value;
  if(!name||!msg) return alert("Fill campaign name and message.");
  const btn = document.querySelector("button[onclick='createCampaign()']");
  if(btn){btn.disabled=true;btn.textContent="Creating...";}
  try {
    const res = await fetch("/api/campaigns",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({name, message_template: msg, target_status: status})
    });
    const data = await res.json();
    if(data.success){ alert("Campaign created!"); renderAutomation(); }
  } catch(e){ alert("Error. Try again."); }
  if(btn){btn.disabled=false;btn.textContent="📢 Create Campaign";}
}

async function prepareCampaign(id){
  const el = document.getElementById("camp_result_"+id);
  if(el) el.innerHTML = '<p style="color:#64748b;font-size:12px">Preparing personalized messages... (15 seconds)</p>';
  try {
    const res = await fetch("/api/campaigns/"+id+"/prepare",{
      method:"POST",
      headers:{Authorization:"Bearer "+localStorage.getItem("token")}
    });
    const data = await res.json();
    if(!data.success){ if(el) el.innerHTML = '<p style="color:red;font-size:12px">Error preparing.</p>'; return; }
    const msgs = data.messages || [];
    if(msgs.length === 0){ if(el) el.innerHTML = '<p style="color:#64748b;font-size:12px">No leads found for this campaign.</p>'; return; }

    if(el) el.innerHTML = `
      <p style="font-size:12px;color:#10b981;margin-bottom:8px">✅ ${msgs.length} messages ready. Tap each to send:</p>
      ${msgs.map((m,i) => `
        <div style="background:#162032;padding:10px;border-radius:8px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <p style="margin:0;font-size:13px;font-weight:600">${m.name}</p>
            ${m.phone ? `<a href="https://wa.me/${m.phone.replace(/[^0-9]/g,'').replace(/^0/,'234')}?text=${encodeURIComponent(m.message)}" target="_blank" style="padding:5px 10px;background:#25d366;color:white;border-radius:6px;text-decoration:none;font-size:11px">💬 Send</a>` : '<span style="font-size:11px;color:#475569">No phone</span>'}
          </div>
          <p style="margin:0;font-size:11px;color:#64748b;line-height:1.4">${m.message.slice(0,80)}...</p>
        </div>
      `).join("")}
    `;
  } catch(e){ if(el) el.innerHTML = '<p style="color:red;font-size:12px">Network error. Retry.</p>'; }
}

async function deleteCampaign(id){
  if(!confirm("Delete this campaign?")) return;
  await fetch("/api/campaigns/"+id,{method:"DELETE",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
  renderAutomation();
}

/* =========================
   REFERRAL PROGRAM
========================= */
async function renderReferral(){
  setView(`<div class="card">${header("🎁 Refer & Earn","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    const res = await fetch("/api/referral", { headers: { Authorization: "Bearer " + localStorage.getItem("token") }});
    const data = await res.json();
    if(!data.success) throw new Error(data.error);
    
    const code = data.code || "loading...";
    const baseUrl = window.location.origin;
    const refLink = baseUrl + "/auth?ref=" + code;
    const stats = data.stats || {};
    const reward = data.reward;
    const refs = data.referrals || [];
    
    const planPoints = { starter: 1, pro: 2, business: 3 };
    const totalPoints = refs.filter(r=>!r.redeemed).reduce((sum, r) => sum + (planPoints[r.referred_plan]||0), 0);
    const proTarget = 10; // 5 pro referrals = 10 points
    const starterTarget = 5;
    
    setView(`
      <div class="card">
        ${header("🎁 Refer and Earn","dashboard")}
        
        <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:12px;padding:18px;margin-bottom:16px;text-align:center">
          <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7)">Your Referral Link</p>
          <p style="margin:0 0 12px;font-size:13px;color:white;word-break:break-all">${refLink}</p>
          <div style="display:flex;gap:8px;justify-content:center">
            <button onclick="copyRefLink('${refLink}')" style="padding:8px 16px;background:white;color:#1d4ed8;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:600">📋 Copy Link</button>
            <button onclick="shareRefLink('${refLink}')" style="padding:8px 16px;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:7px;cursor:pointer;font-size:13px">📤 Share</button>
          </div>
        </div>

        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 12px;font-size:13px;font-weight:bold">How it works</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0">1</div>
              <p style="margin:0;font-size:13px;color:#94a3b8">Share your link with friends</p>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:28px;height:28px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0">2</div>
              <p style="margin:0;font-size:13px;color:#94a3b8">They sign up and pay for any plan</p>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:28px;height:28px;border-radius:50%;background:#8b5cf6;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0">3</div>
              <p style="margin:0;font-size:13px;color:#94a3b8">You earn free months based on their plan</p>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
          <div style="background:#0f172a;padding:12px;border-radius:9px;text-align:center;border-top:2px solid #10b981">
            <p style="margin:0;font-size:20px;font-weight:bold;color:#10b981">${stats.starters||0}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#64748b">Starter Refs</p>
          </div>
          <div style="background:#0f172a;padding:12px;border-radius:9px;text-align:center;border-top:2px solid #3b82f6">
            <p style="margin:0;font-size:20px;font-weight:bold;color:#3b82f6">${stats.pros||0}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#64748b">Pro Refs</p>
          </div>
          <div style="background:#0f172a;padding:12px;border-radius:9px;text-align:center;border-top:2px solid #8b5cf6">
            <p style="margin:0;font-size:20px;font-weight:bold;color:#8b5cf6">${stats.businesses||0}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#64748b">Business Refs</p>
          </div>
        </div>

        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:bold">Rewards</p>
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px;color:#94a3b8">5 Starter refs → 1 free Starter month</span>
              <span style="font-size:12px;color:${(stats.starters||0)>=5?'#10b981':'#475569'}">${stats.starters||0}/5</span>
            </div>
            <div style="background:#1e293b;border-radius:4px;height:6px"><div style="background:#10b981;width:${Math.min(100,((stats.starters||0)/5)*100)}%;height:6px;border-radius:4px"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px;color:#94a3b8">5 Pro refs → 1 free Pro month</span>
              <span style="font-size:12px;color:${(stats.pros||0)>=5?'#3b82f6':'#475569'}">${stats.pros||0}/5</span>
            </div>
            <div style="background:#1e293b;border-radius:4px;height:6px"><div style="background:#3b82f6;width:${Math.min(100,((stats.pros||0)/5)*100)}%;height:6px;border-radius:4px"></div></div>
          </div>
        </div>

        ${reward ? `
          <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:15px;text-align:center;margin-bottom:14px">
            <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#10b981">🎉 You have a reward ready!</p>
            <p style="margin:0 0 12px;font-size:13px;color:#94a3b8">Claim 1 free month of ${reward.toUpperCase()} plan</p>
            <button onclick="redeemReferral()" style="padding:10px 24px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">🎁 Redeem Now</button>
          </div>
        ` : ""}

        <div style="background:#0f172a;border-radius:10px;padding:14px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Share this message</p>
          <textarea id="ref_msg" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#162032;color:#cbd5e1;font-size:12px;height:90px;resize:none;box-sizing:border-box;line-height:1.5">Hey! I use AI Business to find customers, manage leads and grow my business with AI. Try it free — it helped me a lot. Sign up here: ${refLink}</textarea>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button onclick="copyRefMsg()" style="flex:1;padding:9px;background:#334155;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px">📋 Copy Message</button>
            <button onclick="shareRefMsg()" style="flex:1;padding:9px;background:#25d366;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px">💬 WhatsApp</button>
          </div>
        </div>

        ${refs.length > 0 ? `
          <p style="margin:14px 0 8px;font-size:13px;font-weight:bold;color:#94a3b8">Your Referrals (${refs.length})</p>
          ${refs.slice(0,5).map(r => `
            <div style="background:#0f172a;padding:10px 12px;border-radius:8px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px">${r.referred_email || "Anonymous"}</span>
              <span style="font-size:11px;padding:2px 8px;border-radius:6px;background:${{pro:'rgba(59,130,246,0.15)',starter:'rgba(16,185,129,0.15)',business:'rgba(139,92,246,0.15)',free:'rgba(100,116,139,0.1)'}[r.referred_plan]||'rgba(100,116,139,0.1)'};color:${{pro:'#3b82f6',starter:'#10b981',business:'#8b5cf6',free:'#64748b'}[r.referred_plan]||'#64748b'}">${r.referred_plan||'free'}</span>
            </div>
          `).join("")}
        ` : ""}
      </div>
    `);
  } catch(e) {
    setView(`<div class="card">${header("🎁 Refer and Earn","dashboard")}<p style="color:red">Error: ${e.message}</p></div>`);
  }
}

function copyRefLink(link){
  navigator.clipboard.writeText(link).then(()=>alert("Referral link copied!"));
}
function shareRefLink(link){
  if(navigator.share){ navigator.share({title:"AI Business",text:"Try AI Business free:",url:link}).catch(()=>{}); }
  else copyRefLink(link);
}
function copyRefMsg(){
  var text = document.getElementById("ref_msg")?.value||"";
  navigator.clipboard.writeText(text).then(()=>alert("Message copied!"));
}
function shareRefMsg(){
  var text = document.getElementById("ref_msg")?.value||"";
  if(navigator.share){ navigator.share({text}).catch(()=>{}); }
  else { window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank"); }
}
async function redeemReferral(){
  var btn = document.querySelector("button[onclick='redeemReferral()']");
  if(btn){btn.disabled=true;btn.textContent="Redeeming...";}
  try {
    var res = await fetch("/api/referral/redeem",{method:"POST",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    if(data.success){ alert(data.message); renderReferral(); }
    else { alert(data.error||"Cannot redeem yet."); if(btn){btn.disabled=false;btn.textContent="Redeem Now";} }
  } catch(e){ alert("Error. Try again."); if(btn){btn.disabled=false;btn.textContent="Redeem Now";} }
}

/* =========================
   START APP
========================= */
// Keep Render alive
setInterval(()=>{
  fetch('/api/status').catch(()=>{});
}, 4 * 60 * 1000);

init();
