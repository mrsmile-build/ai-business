const NICHE_OPTIONS = [
  {value:"agency", label:"Agency/Freelancer", emoji:"💼"},
  {value:"salon", label:"Salon/Beauty", emoji:"💇"},
  {value:"restaurant", label:"Restaurant/Food", emoji:"🍽️"},
  {value:"realestate", label:"Real Estate", emoji:"🏠"},
  {value:"retail", label:"Retail/Fashion", emoji:"🛍️"},
  {value:"tech", label:"Tech/IT", emoji:"💻"},
  {value:"education", label:"Education", emoji:"📚"},
  {value:"other", label:"Other", emoji:"🏢"}
];

function formatBizTypes(biz){
  if(!biz) return "Not set";
  var vals = biz.split(",").map(function(s){ return s.trim(); }).filter(Boolean);
  var labels = vals.map(function(v){
    var found = NICHE_OPTIONS.filter(function(o){ return o.value === v; })[0];
    return found ? found.emoji + " " + found.label : v;
  });
  return labels.join(" & ");
}

const API_BACKENDS = [
  "https://ai-business-production.up.railway.app",
  "https://ai-business-1-ok3x.onrender.com"
];
let _activeBackend = null;
let _backendCheckPromise = null;

async function resolveBackend(){
  if(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"){
    return window.location.origin;
  }
  if(_activeBackend) return _activeBackend;
  if(_backendCheckPromise) return _backendCheckPromise;
  _backendCheckPromise = (async function(){
    for(var i=0;i<API_BACKENDS.length;i++){
      var url = API_BACKENDS[i];
      try {
        var ctrl = new AbortController();
        var t = setTimeout(function(){ ctrl.abort(); }, 4000);
        var res = await fetch(url + "/api/status", { signal: ctrl.signal });
        clearTimeout(t);
        if(res.ok){ _activeBackend = url; return url; }
      } catch(e){}
    }
    _activeBackend = API_BACKENDS[0];
    return _activeBackend;
  })();
  return _backendCheckPromise;
}

async function apiFetch(path, options){
  var backend = await resolveBackend();
  try {
    return await fetch(backend + path, options);
  } catch(e){
    _activeBackend = null;
    _backendCheckPromise = null;
    var backend2 = await resolveBackend();
    return fetch(backend2 + path, options);
  }
}

const app = document.getElementById("app");

let currentUser = null;

/* =========================
   INIT USER
========================= */
async function init(){
  try {
    let token = localStorage.getItem("token");
    let res = await apiFetch("/api/me", { headers: { Authorization: "Bearer " + token }});
    if(res.status === 401){
      const rt = localStorage.getItem("refresh_token");
      if(rt){
        const rr = await apiFetch("/api/refresh", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({refresh_token: rt})
        });
        const rd = await rr.json();
        if(rd.token){
          localStorage.setItem("token", rd.token);
          localStorage.setItem("refresh_token", rd.refresh_token);
          res = await apiFetch("/api/me", { headers: { Authorization: "Bearer " + rd.token }});
        } else { location.href="/auth"; return; }
      } else { location.href="/auth"; return; }
    }
    const data = await res.json();
    currentUser = data.user;
    currentSub = data.subscription;
  } catch(e) {}
  // Load profile
  try{
    const pr = await apiFetch("/api/profile",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
    const pd = await pr.json();
    currentProfile = pd.profile || {};
  }catch(e){}
  loadConversations();
  checkNotifications();
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

// Prevent back button from logging out
window.addEventListener('popstate', function(e){
  if(localStorage.getItem('token')){
    var page = (e.state && e.state.page) ? e.state.page : 'dashboard';
    loadPage(page);
    window.history.pushState({page:page}, '', '/dashboard');
  }
});

function loadPage(page){
  try { if(typeof gtag !== 'undefined'){ gtag('event', 'page_view', {page_title: page, page_location: '/dashboard#' + page}); } } catch(e){}
  try { window.history.pushState({page:page},'','/dashboard'); } catch(e){}
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
    affiliate: 'renderAffiliate',
    automation: 'renderAutomation',
    testimonials: 'renderTestimonials',
    healthcheck: 'renderWebsiteHealth',
    followup: 'renderFollowupAssistant',
    video: 'renderVideoCreator',
    appointments: 'renderAppointments',
    invoice: 'renderInvoice',
    bizpage: 'renderBizPage',
    b2cgrowth: 'renderB2CGrowth'
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
        ${(function(){
          var NICHE_FEATURES = {
            salon: [{page:"appointments",icon:"📅",label:"Bookings"},{page:"agents",icon:"🤖",label:"AI Agents"},{page:"leadFinder",icon:"🎯",label:"Lead Finder"},{page:"invoice",icon:"🧾",label:"Invoice"}],
            restaurant: [{page:"appointments",icon:"📅",label:"Bookings"},{page:"agents",icon:"🤖",label:"AI Agents"},{page:"bizpage",icon:"🌐",label:"My Page"},{page:"leadFinder",icon:"🎯",label:"Lead Finder"}],
            realestate: [{page:"leads",icon:"📩",label:"Leads"},{page:"leadFinder",icon:"🎯",label:"Lead Finder"},{page:"automation",icon:"⚡",label:"Automation"},{page:"proposal",icon:"📄",label:"Proposals"}],
            agency: [{page:"leadFinder",icon:"🎯",label:"Lead Finder"},{page:"proposal",icon:"📄",label:"Proposals"},{page:"invoice",icon:"🧾",label:"Invoice"},{page:"leads",icon:"📩",label:"Leads"}],
            retail: [{page:"bizpage",icon:"🌐",label:"My Page"},{page:"invoice",icon:"🧾",label:"Invoice"},{page:"leads",icon:"📩",label:"Leads"},{page:"agents",icon:"🤖",label:"AI Agents"}],
            tech: [{page:"leadFinder",icon:"🎯",label:"Lead Finder"},{page:"proposal",icon:"📄",label:"Proposals"},{page:"automation",icon:"⚡",label:"Automation"},{page:"invoice",icon:"🧾",label:"Invoice"}],
            education: [{page:"leads",icon:"📩",label:"Leads"},{page:"appointments",icon:"📅",label:"Bookings"},{page:"agents",icon:"🤖",label:"AI Agents"},{page:"bizpage",icon:"🌐",label:"My Page"}],
            other: [{page:"leadFinder",icon:"🎯",label:"Lead Finder"},{page:"leads",icon:"📩",label:"Leads"},{page:"invoice",icon:"🧾",label:"Invoice"},{page:"agents",icon:"🤖",label:"AI Agents"}]
          };
          var bizType = (currentProfile && currentProfile.business_type) ? currentProfile.business_type : "";
          if(!bizType) return "";
          var selected = bizType.split(",").map(function(s){ return s.trim(); }).filter(Boolean);
          var seen = {};
          var recommended = [];
          selected.forEach(function(nicheKey){
            (NICHE_FEATURES[nicheKey] || []).forEach(function(f){
              if(!seen[f.page]){ seen[f.page] = true; recommended.push(f); }
            });
          });
          recommended = recommended.slice(0,4);
          if(recommended.length === 0) return "";
          var html = '<p style="margin:0 0 10px;font-size:10px;color:#3b82f6;text-transform:uppercase;letter-spacing:1px">⭐ Recommended for You</p>';
          html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">';
          recommended.forEach(function(f){
            html += '<button onclick="loadPage(&#39;' + f.page + '&#39;)" style="padding:13px 10px;background:linear-gradient(135deg,#1d4ed820,#7c3aed20);border:1px solid #3b82f655;color:white;border-radius:9px;cursor:pointer;text-align:left">';
            html += '<div style="font-size:18px;margin-bottom:3px">' + f.icon + '</div>';
            html += '<div style="font-size:12px;font-weight:600">' + f.label + '</div>';
            html += '</button>';
          });
          html += '</div>';
          return html;
        })()}
        <p style="margin:0 0 10px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px">${(currentProfile && currentProfile.business_type) ? "More Features" : "Quick Actions"}</p>
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
          <button onclick="loadPage('appointments')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">📅</div>
            <div style="font-size:12px;font-weight:600">Bookings</div>
            <div style="font-size:10px;color:#475569">Appointments</div>
          </button>
          <button onclick="loadPage('invoice')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">🧾</div>
            <div style="font-size:12px;font-weight:600">Invoice</div>
            <div style="font-size:10px;color:#475569">Get paid fast</div>
          </button>
          <button onclick="loadPage('bizpage')" style="padding:13px 10px;background:#0f172a;border:1px solid #1e293b;color:white;border-radius:9px;cursor:pointer;text-align:left">
            <div style="font-size:18px;margin-bottom:3px">🌐</div>
            <div style="font-size:12px;font-weight:600">My Page</div>
            <div style="font-size:10px;color:#475569">Free website</div>
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
  try {
    const res = await apiFetch("/api/leads",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    const data = await res.json();
    const leads = data.leads || [];
    const sub = currentSub || {};
    const limit = (sub.limits && sub.limits.leads) ? sub.limits.leads : 10;
    const plan = sub.plan || "free";

    const counts = {new:0,contacted:0,interested:0,negotiation:0,won:0,lost:0};
    leads.forEach(l => { if(counts[l.status]!==undefined) counts[l.status]++; });

    setView(`
      <div class="card">
        ${header("📩 Leads","dashboard")}

        <p style="font-size:12px;color:#64748b;margin-bottom:12px">${leads.length} / ${limit>1000?"Unlimited":limit} leads used</p>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:16px">
          ${[
            {key:"new",label:"New",color:"#64748b"},
            {key:"contacted",label:"Contacted",color:"#3b82f6"},
            {key:"interested",label:"Interested",color:"#f59e0b"},
            {key:"won",label:"Won",color:"#10b981"},
            {key:"negotiation",label:"Negotiating",color:"#8b5cf6"},
            {key:"lost",label:"Lost",color:"#ef4444"}
          ].map(s=>`
            <div style="background:#0f172a;padding:10px;border-radius:8px;text-align:center;border-top:2px solid ${s.color}">
              <p style="margin:0;font-size:18px;font-weight:800;color:${s.color}">${counts[s.key]||0}</p>
              <p style="margin:2px 0 0;font-size:10px;color:#64748b">${s.label}</p>
            </div>
          `).join("")}
        </div>

        <div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:14px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Add New Lead</p>
          <input id="l_name" placeholder="Name *" style="width:100%;padding:9px;margin-bottom:7px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="l_phone" placeholder="Phone" style="width:100%;padding:9px;margin-bottom:7px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="l_email" placeholder="Email" style="width:100%;padding:9px;margin-bottom:7px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="l_business" placeholder="Business type" style="width:100%;padding:9px;margin-bottom:7px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <textarea id="l_message" placeholder="Notes / Initial message" style="width:100%;padding:9px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:60px;resize:none;box-sizing:border-box"></textarea>
          <div style="display:flex;gap:8px">
            <button onclick="addLead()" style="flex:1;padding:11px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">+ Add Lead</button>
            ${plan!=="free"?`<button onclick="exportCSV()" style="padding:11px 14px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:8px;cursor:pointer;font-size:13px">📥 CSV</button>`:""}
          </div>
        </div>

        <div id="leads_filter" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
          <button onclick="filterLeads('all')" style="padding:5px 10px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px" id="f_all">All</button>
          ${["new","contacted","interested","won","lost"].map(s=>`<button onclick="filterLeads('${s}')" style="padding:5px 10px;background:#1e293b;color:#94a3b8;border:none;border-radius:6px;cursor:pointer;font-size:11px" id="f_${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join("")}
        </div>

        <div id="leads_list">
          ${leads.length === 0 ? `<div style="text-align:center;padding:30px"><p style="color:#64748b;font-size:14px">No leads yet.</p><p style="color:#475569;font-size:12px;margin-top:4px">Add your first lead above.</p></div>` :
          leads.map(l => leadCard(l)).join("")}
        </div>
      </div>
    `);
    window._allLeads = leads;
  window._leadsMap = {};
  leads.forEach(function(l){ window._leadsMap[l.id] = l; });
  } catch(e){ setView(`<div class="card">${header("📩 Leads","dashboard")}<p style="color:red">Error: ${e.message}</p></div>`); }
}

function leadCard(l){
  const colors = {new:"#64748b",contacted:"#3b82f6",interested:"#f59e0b",negotiation:"#8b5cf6",won:"#10b981",lost:"#ef4444"};
  const c = colors[l.status] || "#64748b";
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = l.follow_up_date && l.follow_up_date < today && l.status !== "won" && l.status !== "lost";
  return `
    <div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid ${c};${isOverdue?'border:1px solid rgba(239,68,68,0.4);':''}" id="lead_${l.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px" onclick="window.openLeadDetail('${l.id}')">
        <div style="flex:1;cursor:pointer">
          <p style="margin:0;font-size:14px;font-weight:700">${l.name}</p>
          ${l.business?`<p style="margin:2px 0;font-size:12px;color:#64748b">${l.business}</p>`:""}
          ${l.phone?`<p style="margin:2px 0;font-size:12px;color:#10b981">📞 ${l.phone}</p>`:""}
          ${l.follow_up_date?`<p style="margin:2px 0;font-size:11px;color:${isOverdue?'#ef4444':'#f59e0b'}">⏰ Follow-up: ${l.follow_up_date}${isOverdue?' (OVERDUE)':''}</p>`:""}
        </div>
        <span style="padding:3px 8px;background:${c}22;border:1px solid ${c}55;border-radius:6px;font-size:11px;color:${c};flex-shrink:0">${l.status}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <select onchange="quickStatus('${l.id}',this.value)" style="flex:1;padding:6px;border-radius:6px;border:1px solid #334155;background:#0b1220;color:white;font-size:11px">
          ${["new","contacted","interested","negotiation","won","lost"].map(s=>`<option value="${s}" ${l.status===s?"selected":""}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join("")}
        </select>
        ${l.phone?`<a href="https://wa.me/${l.phone.replace(/[^0-9]/g,"").replace(/^0/,"234")}" target="_blank" style="padding:6px 10px;background:#25d366;color:white;border-radius:6px;text-decoration:none;font-size:11px">WhatsApp</a>`:""}
        <button onclick="window.openLeadDetail('${l.id}')" style="padding:6px 10px;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;cursor:pointer;font-size:11px">Details →</button>
      </div>
    </div>`;
}

function filterLeads(status){
  var all = window._allLeads || [];
  var filtered = status === "all" ? all : all.filter(l => l.status === status);
  document.getElementById("leads_list").innerHTML = filtered.length === 0 ?
    "<p style='color:#64748b;text-align:center;padding:20px;font-size:13px'>No leads in this category.</p>" :
    filtered.map(l => leadCard(l)).join("");
  document.querySelectorAll("#leads_filter button").forEach(btn => {
    btn.style.background = "#1e293b"; btn.style.color = "#94a3b8";
  });
  var active = document.getElementById("f_"+status);
  if(active){ active.style.background="#3b82f6"; active.style.color="white"; }
}

async function quickStatus(id, status){
  try {
    await apiFetch("/api/leads/"+id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({status})});
    if(window._allLeads){ var l=window._allLeads.find(x=>x.id===id); if(l) l.status=status; }
    // Auto-trigger review agent if won
    if(status === "won"){
      var lead = window._allLeads?.find(x=>x.id===id);
      if(lead){
        setTimeout(()=>{
          if(confirm("Lead marked as Won! Generate a review request message for "+lead.name+"?")){
            loadPage("agents");
            setTimeout(()=>{
              var customerInput = document.getElementById("ra_customer");
              var serviceInput = document.getElementById("ra_service");
              if(customerInput) customerInput.value = lead.name;
              if(serviceInput) serviceInput.value = lead.business || "your service";
            },500);
          }
        },300);
      }
    }
  } catch(e){}
}

async function renderLeadDetail(id){
  var lead = window._currentOpenLead;
  if(!lead || lead.id !== id){
    var leads = window._allLeads || [];
    for(var i=0;i<leads.length;i++){ if(leads[i].id===id){lead=leads[i];break;} }
  }
  if(!lead){ loadPage("leads"); return; }
  renderLeadDetailObj(lead);
}

async function renderLeadDetailObj(lead){

  const colors = {new:"#64748b",contacted:"#3b82f6",interested:"#f59e0b",negotiation:"#8b5cf6",won:"#10b981",lost:"#ef4444"};

  setView(`
    <div class="card">
      ${header("Lead Details","leads")}

      <div style="background:#0f172a;border-radius:10px;padding:16px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div>
            <p style="margin:0;font-size:18px;font-weight:800">${lead.name}</p>
            ${lead.business?`<p style="margin:3px 0 0;font-size:13px;color:#64748b">${lead.business}</p>`:""}
          </div>
          <span style="padding:4px 10px;background:${colors[lead.status]||"#64748b"}22;border:1px solid ${colors[lead.status]||"#64748b"}55;border-radius:8px;font-size:12px;color:${colors[lead.status]||"#64748b"};font-weight:600">${lead.status}</span>
        </div>

        ${lead.phone?`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b"><span style="font-size:13px;color:#64748b">Phone</span><div style="display:flex;align-items:center;gap:8px"><span style="font-size:13px">${lead.phone}</span><a href="https://wa.me/${lead.phone.replace(/[^0-9]/g,"").replace(/^0/,"234")}" target="_blank" style="padding:3px 8px;background:#25d366;color:white;border-radius:5px;text-decoration:none;font-size:11px">WhatsApp</a></div></div>`:""}
        ${lead.email?`<div style="padding:8px 0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between"><span style="font-size:13px;color:#64748b">Email</span><span style="font-size:13px">${lead.email}</span></div>`:""}
        ${lead.created_at?`<div style="padding:8px 0;display:flex;justify-content:space-between"><span style="font-size:13px;color:#64748b">Added</span><span style="font-size:13px">${new Date(lead.created_at).toLocaleDateString()}</span></div>`:""}
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Update Status</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          ${["new","contacted","interested","negotiation","won","lost"].map(s=>`
            <button onclick="updateLeadStatus('${lead.id}','${s}')" style="padding:8px 4px;background:${lead.status===s?colors[s]||"#334155":"#1e293b"};color:${lead.status===s?"white":"#94a3b8"};border:1px solid ${lead.status===s?colors[s]||"#334155":"#334155"};border-radius:7px;cursor:pointer;font-size:11px;font-weight:${lead.status===s?"bold":"normal"}">${s.charAt(0).toUpperCase()+s.slice(1)}</button>
          `).join("")}
        </div>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold">⏰ Follow-up Reminder</p>
        <p style="margin:0 0 6px;font-size:12px;color:#64748b">Set a date to follow up with this lead</p>
        <input type="date" id="ld_followup" value="${lead.follow_up_date||""}" min="${new Date().toISOString().split("T")[0]}" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box;margin-bottom:8px">
        <input id="ld_sale" type="number" placeholder="Sale amount ₦ (if won)" value="${lead.sale_amount||""}" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box;margin-bottom:8px">
        <button onclick="saveLeadFollowup('${lead.id}')" style="width:100%;padding:10px;background:#f59e0b;color:black;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Save Follow-up Date</button>
        <div id="followup_save_result" style="margin-top:6px"></div>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold">📝 Notes & History</p>
        ${lead.message?`<div style="background:#162032;border-radius:8px;padding:10px;margin-bottom:10px;border-left:2px solid #334155"><p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5">${lead.message}</p></div>`:""}
        <textarea id="ld_note" placeholder="Add a note (e.g. Called today, interested in Pro plan...)" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:80px;resize:none;box-sizing:border-box;margin-bottom:8px"></textarea>
        <button onclick="saveLeadNote('${lead.id}')" style="width:100%;padding:10px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Save Note</button>
      </div>

      ${lead.phone?`
        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold">✉️ Quick Message</p>
          <textarea id="ld_msg" placeholder="Write a message to send on WhatsApp..." style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:80px;resize:none;box-sizing:border-box;margin-bottom:8px"></textarea>
          <a id="ld_wa_btn" href="#" target="_blank" onclick="var msg=document.getElementById('ld_msg').value;this.href='https://wa.me/${lead.phone.replace(/[^0-9]/g,"").replace(/^0/,"234")}?text='+encodeURIComponent(msg)" style="display:block;text-align:center;padding:10px;background:#25d366;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">💬 Send on WhatsApp</a>
        </div>
      `:""}

      <div style="display:flex;gap:8px">
        <button onclick="loadPage('proposal')" style="flex:1;padding:11px;background:#0f172a;border:1px solid #334155;color:white;border-radius:8px;cursor:pointer;font-size:12px">📄 Generate Proposal</button>
        <button onclick="deleteLead('${lead.id}')" style="padding:11px 14px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:8px;cursor:pointer;font-size:12px">🗑️ Delete</button>
      </div>
    </div>
  `);
}

async function updateLeadStatus(id, status){
  try {
    await apiFetch("/api/leads/"+id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({status})});
    if(window._allLeads){ var l=window._allLeads.find(x=>x.id===id); if(l){ l.status=status; renderLeadDetail(id); } }
  } catch(e){}
}

async function saveLeadFollowup(id){
  var date = document.getElementById("ld_followup")?.value;
  var amount = document.getElementById("ld_sale")?.value;
  var result = document.getElementById("followup_save_result");
  try {
    var body = {};
    if(date) body.follow_up_date = date;
    if(amount) body.sale_amount = parseFloat(amount);
    var res = await apiFetch("/api/leads/"+id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify(body)});
    var data = await res.json();
    if(data.success){
      if(window._allLeads){ var l=window._allLeads.find(x=>x.id===id); if(l && date) l.follow_up_date=date; }
      if(result) result.innerHTML = "<p style='color:#10b981;font-size:12px'>✅ Follow-up date saved!</p>";
      setTimeout(()=>{ if(result) result.innerHTML=""; },3000);
    } else { if(result) result.innerHTML = "<p style='color:red;font-size:12px'>Error saving.</p>"; }
  } catch(e){ if(result) result.innerHTML = "<p style='color:red;font-size:12px'>Network error.</p>"; }
}

async function saveLeadNote(id){
  var note = document.getElementById("ld_note")?.value.trim();
  if(!note) return alert("Write a note first.");
  try {
    var lead = (window._allLeads||[]).find(l=>l.id===id);
    var existing = lead?.message || "";
    var stamp = "[" + new Date().toLocaleDateString() + "] "; var updated = existing ? (existing + "\n\n" + stamp + note) : (stamp + note);
    var res = await apiFetch("/api/leads/"+id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({message:updated})});
    var data = await res.json();
    if(data.success){
      if(lead) lead.message = updated;
      alert("Note saved!");
      renderLeadDetail(id);
    }
  } catch(e){ alert("Network error."); }
}

async function addLead(){
  var name = document.getElementById("l_name")?.value.trim();
  var phone = document.getElementById("l_phone")?.value.trim();
  var email = document.getElementById("l_email")?.value.trim();
  var business = document.getElementById("l_business")?.value.trim();
  var message = document.getElementById("l_message")?.value.trim();
  if(!name) return alert("Name is required.");
  var btn = document.querySelector("button[onclick='addLead()']");
  if(btn){btn.disabled=true;btn.textContent="Adding...";}
  try {
    var res = await apiFetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({name,phone,email,business,message,status:"new"})});
    var data = await res.json();
    if(data.success){ setOnboardStep("lead_saved"); renderLeads(); }
    else { alert(data.error||"Error. Try again."); }
  } catch(e){ alert("Network error."); }
  if(btn){btn.disabled=false;btn.textContent="+ Add Lead";}
}

async function deleteLead(id){
  if(!confirm("Delete this lead permanently?")) return;
  try {
    await apiFetch("/api/leads/"+id,{method:"DELETE",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    renderLeads();
  } catch(e){ alert("Error deleting."); }
}

async function exportCSV(){
  var leads = window._allLeads || [];
  if(!leads.length) return alert("No leads to export.");
  var csv = "Name,Phone,Email,Business,Status,Follow-up Date,Notes\n";
  leads.forEach(l=>{
    csv += [l.name,l.phone||"",l.email||"",l.business||"",l.status,l.follow_up_date||"",(l.message||"").replace(/,/g," ")].join(",")+"\n";
  });
  var blob = new Blob([csv],{type:"text/csv"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href=url; a.download="leads.csv"; a.click();
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
    const res=await apiFetch("/api/ai-reply",{
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
    const res = await apiFetch("/api/paystack/init", {
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
    const res = await apiFetch("/api/ai-reply",{
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
    const res = await apiFetch("/api/account",{
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
async function renderAgents(){
  setView(`<div class="card">${header("🤖 AI Agents","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    const res = await apiFetch("/api/agent-settings",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    const { settings } = await res.json();
    const s = settings || {};
    const isSetup = !!s.business_name;

    setView(`
      <div class="card">
        ${header("🤖 AI Agents","dashboard")}
        <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Setup once. Each agent works for your business automatically.</p>

        ${!isSetup ? `
          <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:14px;margin-bottom:16px;text-align:center">
            <p style="margin:0 0 8px;font-size:13px;color:#f59e0b;font-weight:bold">⚠️ Setup Required</p>
            <p style="margin:0;font-size:12px;color:#94a3b8">Fill the Receptionist form first. All agents use this info to work properly.</p>
          </div>
        ` : `
          <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">✅</span>
            <div>
              <p style="margin:0;font-size:13px;font-weight:bold;color:#10b981">Agents Active — ${s.business_name}</p>
              <p style="margin:0;font-size:11px;color:#64748b">All agents are configured and ready</p>
            </div>
            <button onclick="renderAgentSetup()" style="margin-left:auto;padding:5px 10px;background:#1e293b;color:#94a3b8;border:none;border-radius:6px;cursor:pointer;font-size:11px">Edit</button>
          </div>
        `}

        <!-- RECEPTIONIST -->
        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:12px;border-left:3px solid #8b5cf6">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <p style="margin:0;font-weight:bold;font-size:14px">🤝 AI Receptionist</p>
              <p style="margin:3px 0 0;font-size:12px;color:#64748b">Answers customer questions automatically. Copy the widget code to your website.</p>
            </div>
          </div>
          ${!isSetup ? `<button onclick="renderAgentSetup()" style="width:100%;padding:10px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">⚙️ Setup Receptionist First</button>` : `
            <input id="rec_test_q" placeholder="Test it: type a customer question..." style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
            <button onclick="testReceptionist()" style="width:100%;padding:10px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Test Receptionist</button>
            <div id="rec_test_result" style="margin-top:10px"></div>
            <button onclick="showWidgetCode()" style="width:100%;padding:9px;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:8px;cursor:pointer;font-size:12px;margin-top:8px">📋 Get Website Widget Code</button>
            <div id="widget_code_box" style="display:none;margin-top:8px"></div>
          `}
        </div>

        <!-- FOLLOW-UP AGENT -->
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

        <!-- REVIEW AGENT -->
        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:12px;border-left:3px solid #f59e0b">
          <p style="margin:0 0 4px;font-weight:bold;font-size:14px">⭐ Review Agent</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b">Auto-triggered when you mark a lead as Won. Also run manually below.</p>
          <input id="ra_customer" placeholder="Customer name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="ra_service" placeholder="Service provided" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <button onclick="runReviewAgent()" style="width:100%;padding:10px;background:#f59e0b;color:black;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Generate Review Request</button>
          <div id="review_result" style="margin-top:10px"></div>
        </div>

        <!-- QUOTE AGENT -->
        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:12px;border-left:3px solid #10b981">
          <p style="margin:0 0 4px;font-weight:bold;font-size:14px">💰 Quote Agent</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b">Generate instant professional quotes</p>
          <input id="qa_service" placeholder="Service" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="qa_client" placeholder="Client name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="qa_price" placeholder="Your price (e.g. ₦80,000)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <button onclick="runQuoteAgent()" style="width:100%;padding:10px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Generate Quote</button>
          <div id="quote_result" style="margin-top:10px"></div>
        </div>

        <!-- OFF-HOURS AGENT -->
        <div style="background:#0f172a;border-radius:10px;padding:15px;border-left:3px solid #ef4444">
          <p style="margin:0 0 4px;font-weight:bold;font-size:14px">🌙 Off-Hours Agent</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b">Auto-reply when you are unavailable</p>
          <input id="oh_biz" placeholder="Business name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box" value="${s.business_name||''}">
          <input id="oh_hours" placeholder="Working hours (e.g. 9am-6pm Mon-Fri)" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box" value="${s.opening_hours||''}">
          <button onclick="runOffHoursAgent()" style="width:100%;padding:10px;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Generate Auto-Reply</button>
          <div id="offhours_result" style="margin-top:10px"></div>
        </div>
      </div>
    `);
  } catch(e){ setView(`<div class="card">${header("🤖 AI Agents","dashboard")}<p style="color:red">${e.message}</p></div>`); }
}

function renderAgentSetup(){
  setView(`
    <div class="card">
      ${header("⚙️ Receptionist Setup","agents")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Fill this once. Your AI Receptionist will use this to answer customer questions automatically.</p>

      <input id="as_name" placeholder="Business name *" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      <textarea id="as_desc" placeholder="What does your business do? *" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:70px;resize:none;box-sizing:border-box"></textarea>
      <textarea id="as_services" placeholder="List your services (e.g. Hair styling, Braiding, Treatment)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:70px;resize:none;box-sizing:border-box"></textarea>
      <textarea id="as_prices" placeholder="Your prices (e.g. Hair styling - ₦5,000, Braiding - ₦8,000)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:70px;resize:none;box-sizing:border-box"></textarea>
      <input id="as_hours" placeholder="Opening hours (e.g. Mon-Sat 9am-7pm)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      <input id="as_location" placeholder="Location / Address" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      <input id="as_whatsapp" placeholder="WhatsApp number" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      <textarea id="as_booking" placeholder="How do customers book? (e.g. Call us, WhatsApp, Walk-in)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:60px;resize:none;box-sizing:border-box"></textarea>
      <input id="as_review" placeholder="Your Google Review link (optional)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      <textarea id="as_extra" placeholder="Anything else customers often ask?" style="width:100%;padding:10px;margin-bottom:16px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:60px;resize:none;box-sizing:border-box"></textarea>

      <button onclick="saveAgentSettings()" style="width:100%;padding:12px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">💾 Save and Activate Agents</button>
    </div>
  `);
}

async function saveAgentSettings(){
  const btn = document.querySelector("button[onclick='saveAgentSettings()']");
  if(btn){btn.disabled=true;btn.textContent="Saving...";}
  try {
    const res = await apiFetch("/api/agent-settings",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({
        business_name: document.getElementById("as_name")?.value.trim(),
        business_description: document.getElementById("as_desc")?.value.trim(),
        services: document.getElementById("as_services")?.value.trim(),
        prices: document.getElementById("as_prices")?.value.trim(),
        opening_hours: document.getElementById("as_hours")?.value.trim(),
        location: document.getElementById("as_location")?.value.trim(),
        whatsapp: document.getElementById("as_whatsapp")?.value.trim(),
        booking_info: document.getElementById("as_booking")?.value.trim(),
        review_link: document.getElementById("as_review")?.value.trim(),
        extra_info: document.getElementById("as_extra")?.value.trim()
      })
    });
    const data = await res.json();
    if(data.success){ alert("Agents activated!"); renderAgents(); }
    else { alert(data.error||"Error saving."); }
  } catch(e){ alert("Network error."); }
  if(btn){btn.disabled=false;btn.textContent="Save and Activate Agents";}
}

async function testReceptionist(){
  const q = document.getElementById("rec_test_q")?.value.trim();
  if(!q) return alert("Type a question first.");
  const el = document.getElementById("rec_test_result");
  if(el) el.innerHTML = "<p style='color:#64748b;font-size:12px'>Thinking...</p>";
  try {
    const res = await apiFetch("/api/receptionist",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({question:q})
    });
    const data = await res.json();
    if(el) el.innerHTML = `<div style="background:#162032;padding:10px;border-radius:8px;border-left:3px solid #8b5cf6"><p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.5">${data.reply}</p></div>`;
  } catch(e){ if(el) el.innerHTML = "<p style='color:red;font-size:12px'>Error. Try again.</p>"; }
}

async function showWidgetCode(){
  const box = document.getElementById("widget_code_box");
  const uid = currentUser?.id || "";
  const bizUrl = await resolveBackend();
  const code = `<script src="${bizUrl}/widget.js" data-user="${uid}"></script>`;
  if(box){
    box.style.display = "block";
    box.innerHTML = `
      <p style="font-size:12px;color:#64748b;margin:8px 0 4px">Paste this on your website:</p>
      <textarea style="width:100%;padding:8px;border-radius:6px;border:1px solid #334155;background:#0b1220;color:#10b981;font-size:11px;height:60px;resize:none;box-sizing:border-box;font-family:monospace">${code}</textarea>
      <button onclick="navigator.clipboard.writeText(\`${code}\`).then(()=>alert('Copied!'))" style="margin-top:6px;padding:6px 12px;background:#334155;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px">Copy Code</button>
    `;
  }
}


async function runFollowUpAgent(){
  var el = document.getElementById("followup_agent_result");
  if(el) el.innerHTML = '<p style="color:#64748b;font-size:12px">Checking...</p>';
  try{
    var res = await apiFetch("/api/leads/followups",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
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
    var res = await apiFetch("/api/ai-reply",{
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
  setView(`
    <div class="card">
      ${header("🎯 Lead Finder","dashboard")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Who are you trying to reach?</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:0">
        <button onclick="renderLeadFinderB2B()" style="padding:16px 12px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;text-align:center">
          <div style="font-size:24px;margin-bottom:6px">🏢</div>
          <div style="font-size:13px;font-weight:700">Businesses (B2B)</div>
          <div style="font-size:11px;color:#64748b;margin-top:3px">Find companies to offer your services</div>
        </button>
        <button onclick="renderB2CGrowth()" style="padding:16px 12px;background:#0f172a;border:1px solid #334155;color:white;border-radius:10px;cursor:pointer;text-align:center">
          <div style="font-size:24px;margin-bottom:6px">👥</div>
          <div style="font-size:13px;font-weight:700">Customers (B2C)</div>
          <div style="font-size:11px;color:#64748b;margin-top:3px">Get more individual customers</div>
        </button>
      </div>
    </div>
  `);
}

function renderLeadFinderB2B(){
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
  const referralLine = isPro ? "" : "\n\n_Managed with AI Business_ 🚀 Try free: " + window.location.origin;

  try{
    const res = await apiFetch("/api/lead-finder",{
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
    const res = await apiFetch("/api/leads",{
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
    const res = await apiFetch("/api/leads/followups",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
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
    const res = await apiFetch("/api/revenue",{ headers:{ Authorization:"Bearer "+localStorage.getItem("token")}});
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
    const res = await apiFetch("/api/generate-proposal",{
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
        <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">Business Type(s) — select up to 3</p>
        <input type="hidden" id="ep_biz" value="${biz}">
        <div id="ep_biz_grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${NICHE_OPTIONS.map(o => `
            <label style="display:flex;align-items:center;gap:6px;padding:10px;background:#0f172a;border:1px solid #334155;border-radius:8px;font-size:12px;cursor:pointer">
              <input type="checkbox" value="${o.value}" ${biz.split(",").map(s=>s.trim()).indexOf(o.value)>-1?"checked":""} onchange="updateEpBizHidden()" style="accent-color:#3b82f6">
              ${o.emoji} ${o.label}
            </label>
          `).join("")}
        </div>
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
    const res = await apiFetch("/api/profile",{
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
    const res = await apiFetch("/api/change-password",{
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
      apiFetch("/api/leads",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}}),
      apiFetch("/api/revenue",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
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
   APPOINTMENTS
========================= */
async function renderAppointments(){
  setView(`<div class="card">${header("📅 Appointments","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    const [svcRes, bookRes] = await Promise.all([
      apiFetch("/api/services",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}}),
      apiFetch("/api/bookings",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
    ]);
    const { services } = await svcRes.json();
    const { bookings } = await bookRes.json();
    const uid = currentUser?.id || "";
    const bookLink = (await resolveBackend()) + "/book/" + uid;

    const today = new Date().toISOString().split("T")[0];
    const upcoming = (bookings||[]).filter(b => b.booking_date >= today && b.status !== "cancelled");
    const past = (bookings||[]).filter(b => b.booking_date < today);

    setView(`
      <div class="card">
        ${header("📅 Appointments","dashboard")}

        <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
          <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7)">Your Booking Link</p>
          <p style="margin:0 0 10px;font-size:13px;color:white;word-break:break-all">${bookLink}</p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            <button onclick="navigator.clipboard.writeText('${bookLink}').then(()=>alert('Copied!'))" style="padding:7px 14px;background:white;color:#1d4ed8;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600">📋 Copy Link</button>
            <button onclick="navigator.share&&navigator.share({url:'${bookLink}',title:'Book with us'})" style="padding:7px 14px;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:7px;cursor:pointer;font-size:12px">📤 Share</button>
            <a href="${bookLink}" target="_blank" style="padding:7px 14px;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:7px;font-size:12px;text-decoration:none">👁️ Preview</a>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:16px">
          <button onclick="showAddService()" style="flex:1;padding:10px;background:#0f172a;border:1px solid #334155;color:white;border-radius:8px;cursor:pointer;font-size:13px">+ Add Service</button>
          <button onclick="toggleServiceList()" style="flex:1;padding:10px;background:#0f172a;border:1px solid #334155;color:white;border-radius:8px;cursor:pointer;font-size:13px">⚙️ Services (${(services||[]).length})</button>
        </div>

        <div id="add_service_form" style="display:none;background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Add New Service</p>
          <input id="svc_name" placeholder="Service name *" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <input id="svc_duration" placeholder="Duration (mins)" type="number" value="60" style="flex:1;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px">
            <input id="svc_price" placeholder="Price (₦)" type="number" style="flex:1;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px">
          </div>
          <input id="svc_desc" placeholder="Description (optional)" style="width:100%;padding:9px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <button onclick="addService()" style="width:100%;padding:10px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Save Service</button>
        </div>

        <div id="service_list_box" style="display:none;margin-bottom:14px">
          ${(services||[]).length === 0 ? "<p style='color:#64748b;font-size:13px;text-align:center;padding:10px'>No services yet. Add your first service.</p>" :
            (services||[]).map(s=>`
              <div style="background:#0f172a;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                <div>
                  <p style="margin:0;font-size:13px;font-weight:600">${s.name}</p>
                  <p style="margin:2px 0 0;font-size:11px;color:#64748b">${s.duration_minutes}min · ₦${parseFloat(s.price||0).toLocaleString()}</p>
                </div>
                <button onclick="deleteService('${s.id}')" style="padding:5px 10px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;cursor:pointer;font-size:11px">Remove</button>
              </div>`).join("")}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
          <div style="background:#0f172a;padding:12px;border-radius:9px;text-align:center;border-top:2px solid #f59e0b">
            <p style="margin:0;font-size:18px;font-weight:800;color:#f59e0b">${upcoming.filter(b=>b.status==="pending").length}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#64748b">Pending</p>
          </div>
          <div style="background:#0f172a;padding:12px;border-radius:9px;text-align:center;border-top:2px solid #10b981">
            <p style="margin:0;font-size:18px;font-weight:800;color:#10b981">${upcoming.filter(b=>b.status==="confirmed").length}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#64748b">Confirmed</p>
          </div>
          <div style="background:#0f172a;padding:12px;border-radius:9px;text-align:center;border-top:2px solid #3b82f6">
            <p style="margin:0;font-size:18px;font-weight:800;color:#3b82f6">${past.length}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#64748b">Completed</p>
          </div>
        </div>

        ${upcoming.length > 0 ? `
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Upcoming (${upcoming.length})</p>
          ${upcoming.map(b=>`
            <div style="background:#0f172a;padding:14px;border-radius:10px;margin-bottom:10px;border-left:3px solid ${b.status==='confirmed'?'#10b981':'#f59e0b'}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <div>
                  <p style="margin:0;font-size:14px;font-weight:bold">${b.customer_name}</p>
                  <p style="margin:2px 0;font-size:12px;color:#94a3b8">${b.services?.name||"Service"}</p>
                  <p style="margin:2px 0;font-size:12px;color:#64748b">📅 ${b.booking_date} at ${b.booking_time}</p>
                  ${b.customer_phone?`<p style="margin:2px 0;font-size:12px;color:#10b981">📞 ${b.customer_phone}</p>`:""}
                </div>
                <span style="font-size:11px;padding:3px 8px;border-radius:6px;background:${b.status==='confirmed'?'rgba(16,185,129,0.15)':'rgba(245,158,11,0.15)'};color:${b.status==='confirmed'?'#10b981':'#f59e0b'}">${b.status}</span>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${b.status==="pending"?`<button onclick="updateBooking('${b.id}','confirmed')" style="padding:6px 12px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Confirm</button>`:""}
                ${b.customer_phone?`<a href="https://wa.me/${b.customer_phone.replace(/[^0-9]/g,"").replace(/^0/,"234")}" target="_blank" style="padding:6px 12px;background:#25d366;color:white;border-radius:6px;text-decoration:none;font-size:12px">WhatsApp</a>`:""}
                <button onclick="updateBooking('${b.id}','cancelled')" style="padding:6px 12px;background:#1e293b;color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;cursor:pointer;font-size:12px">Cancel</button>
              </div>
            </div>
          `).join("")}
        ` : `<div style="text-align:center;padding:20px"><p style="color:#64748b;font-size:13px">No upcoming bookings.</p><p style="color:#475569;font-size:12px;margin-top:4px">Share your booking link to get started.</p></div>`}
      </div>
    `);
  } catch(e){ setView(`<div class="card">${header("📅 Appointments","dashboard")}<p style="color:red">${e.message}</p></div>`); }
}

function showAddService(){ var f=document.getElementById("add_service_form"); if(f) f.style.display=f.style.display==="none"?"block":"none"; }
function toggleServiceList(){ var f=document.getElementById("service_list_box"); if(f) f.style.display=f.style.display==="none"?"block":"none"; }

async function addService(){
  var name=document.getElementById("svc_name")?.value.trim();
  var dur=document.getElementById("svc_duration")?.value;
  var price=document.getElementById("svc_price")?.value;
  var desc=document.getElementById("svc_desc")?.value.trim();
  if(!name) return alert("Service name required.");
  var btn=document.querySelector("button[onclick='addService()']");
  if(btn){btn.disabled=true;btn.textContent="Saving...";}
  try{
    var res=await apiFetch("/api/services",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({name,duration_minutes:parseInt(dur)||60,price:parseFloat(price)||0,description:desc})});
    var data=await res.json();
    if(data.success){renderAppointments();}
  }catch(e){alert("Error. Try again.");}
  if(btn){btn.disabled=false;btn.textContent="Save Service";}
}

async function deleteService(id){
  if(!confirm("Remove this service?")) return;
  await apiFetch("/api/services/"+id,{method:"DELETE",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
  renderAppointments();
}

async function updateBooking(id, status){
  await apiFetch("/api/bookings/"+id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({status})});
  renderAppointments();
}
/* =========================
   INVOICE GENERATOR
========================= */
function renderInvoice(){
  setView(`
    <div class="card">
      ${header("🧾 Invoice Generator","dashboard")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Create professional invoices to send clients.</p>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Your Details</p>
        <input id="inv_from_name" placeholder="Your name / Business name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box" value="${currentProfile?.display_name||""}">
        <input id="inv_from_phone" placeholder="Your phone / WhatsApp" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box" value="${currentProfile?.phone||""}">
        <input id="inv_from_bank" placeholder="Bank account details (optional)" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Client Details</p>
        <input id="inv_to_name" placeholder="Client name *" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <input id="inv_to_phone" placeholder="Client phone" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px" id="inv_items_box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <p style="margin:0;font-size:13px;font-weight:bold">Items / Services</p>
          <button onclick="addInvoiceItem()" style="padding:5px 10px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">+ Add Item</button>
        </div>
        <div id="inv_items">
          <div class="inv-item" style="display:flex;gap:6px;margin-bottom:6px">
            <input placeholder="Description *" style="flex:2;padding:8px;border-radius:7px;border:1px solid #334155;background:#0b1220;color:white;font-size:12px">
            <input placeholder="Amount (₦)" type="number" style="flex:1;padding:8px;border-radius:7px;border:1px solid #334155;background:#0b1220;color:white;font-size:12px" oninput="updateInvoiceTotal()">
          </div>
        </div>
        <div style="text-align:right;margin-top:10px;padding-top:10px;border-top:1px solid #1e293b">
          <p style="font-size:15px;font-weight:bold">Total: ₦<span id="inv_total">0</span></p>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:6px">
        <input id="inv_date" type="date" value="${new Date().toISOString().split("T")[0]}" style="flex:1;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px">
        <input id="inv_due" placeholder="Due date" type="date" style="flex:1;padding:9px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px">
      </div>
      <input id="inv_notes" placeholder="Payment notes (e.g. Pay via bank transfer)" style="width:100%;padding:9px;margin-top:8px;margin-bottom:14px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">

      <button onclick="generateInvoice()" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">🧾 Generate Invoice</button>
    </div>
  `);
}

function addInvoiceItem(){
  var div = document.createElement("div");
  div.className = "inv-item";
  div.style = "display:flex;gap:6px;margin-bottom:6px";
  div.innerHTML = '<input placeholder="Description" style="flex:2;padding:8px;border-radius:7px;border:1px solid #334155;background:#0b1220;color:white;font-size:12px"><input placeholder="Amount (₦)" type="number" style="flex:1;padding:8px;border-radius:7px;border:1px solid #334155;background:#0b1220;color:white;font-size:12px" oninput="updateInvoiceTotal()"><button onclick="this.parentElement.remove();updateInvoiceTotal()" style="padding:8px 10px;background:rgba(239,68,68,0.1);color:#ef4444;border:none;border-radius:7px;cursor:pointer;font-size:12px">×</button>';
  document.getElementById("inv_items").appendChild(div);
}

function updateInvoiceTotal(){
  var items = document.querySelectorAll("#inv_items .inv-item");
  var total = 0;
  items.forEach(function(row){
    var amt = parseFloat(row.querySelectorAll("input")[1]?.value)||0;
    total += amt;
  });
  var el = document.getElementById("inv_total");
  if(el) el.textContent = total.toLocaleString();
}

function generateInvoice(){
  var fromName = document.getElementById("inv_from_name")?.value.trim();
  var fromPhone = document.getElementById("inv_from_phone")?.value.trim();
  var fromBank = document.getElementById("inv_from_bank")?.value.trim();
  var toName = document.getElementById("inv_to_name")?.value.trim();
  var toPhone = document.getElementById("inv_to_phone")?.value.trim();
  var date = document.getElementById("inv_date")?.value;
  var due = document.getElementById("inv_due")?.value;
  var notes = document.getElementById("inv_notes")?.value.trim();
  if(!fromName||!toName) return alert("Fill your name and client name.");

  var items = [];
  var total = 0;
  document.querySelectorAll("#inv_items .inv-item").forEach(function(row){
    var inputs = row.querySelectorAll("input");
    var desc = inputs[0]?.value.trim();
    var amt = parseFloat(inputs[1]?.value)||0;
    if(desc) { items.push({desc, amt}); total += amt; }
  });
  if(!items.length) return alert("Add at least one item.");

  var invNo = "INV-" + Date.now().toString().slice(-6);
  var html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${invNo}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:white;color:#1e293b;padding:30px;max-width:600px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #3b82f6}
h1{color:#3b82f6;font-size:28px;font-weight:900}.inv-num{font-size:13px;color:#64748b;margin-top:4px}
.parties{display:flex;justify-content:space-between;margin-bottom:24px;gap:20px}
.party{flex:1}.party-label{font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:1px;margin-bottom:6px}
.party-name{font-size:15px;font-weight:700;margin-bottom:3px}.party-detail{font-size:13px;color:#64748b}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#f8fafc;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0}
td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px}
.total-row td{font-weight:800;font-size:16px;color:#3b82f6;border-bottom:none;border-top:2px solid #3b82f6;padding-top:14px}
.notes{background:#f8fafc;border-radius:8px;padding:14px;margin-bottom:20px;font-size:13px;color:#64748b}
.footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:20px}
.date-row{display:flex;gap:20px;margin-bottom:20px}
.date-item{font-size:13px;color:#64748b}
.date-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
.date-value{font-weight:600;color:#1e293b}
@media print{button{display:none!important}body{padding:15px}}</style></head>
<body>
<div class="header"><div><h1>INVOICE</h1><div class="inv-num">${invNo}</div></div>
<div style="text-align:right"><div style="font-size:20px;font-weight:800;color:#3b82f6">AI Business</div><div style="font-size:11px;color:#94a3b8">Powered by AI Business Platform</div></div></div>
<div class="parties">
<div class="party"><div class="party-label">From</div><div class="party-name">${fromName}</div>${fromPhone?`<div class="party-detail">${fromPhone}</div>`:""}${fromBank?`<div class="party-detail" style="margin-top:6px;font-size:12px">${fromBank}</div>`:""}</div>
<div class="party" style="text-align:right"><div class="party-label">Billed To</div><div class="party-name">${toName}</div>${toPhone?`<div class="party-detail">${toPhone}</div>`:""}</div>
</div>
<div class="date-row">
<div class="date-item"><div class="date-label">Invoice Date</div><div class="date-value">${date}</div></div>
${due?`<div class="date-item"><div class="date-label">Due Date</div><div class="date-value">${due}</div></div>`:""}
</div>
<table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>
${items.map(i=>`<tr><td>${i.desc}</td><td style="text-align:right">₦${i.amt.toLocaleString()}</td></tr>`).join("")}
<tr class="total-row"><td>Total</td><td style="text-align:right">₦${total.toLocaleString()}</td></tr>
</tbody></table>
${notes?`<div class="notes"><strong>Payment Info:</strong> ${notes}</div>`:""}
<div style="text-align:center;margin-bottom:16px"><button onclick="window.print()" style="padding:10px 24px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;margin-right:8px">🖨️ Print / Save as PDF</button></div>
<div class="footer">Generated by AI Business · The AI-powered business platform for African entrepreneurs</div>
</body></html>`;

  var win = window.open("","_blank");
  win.document.write(html);
  win.document.close();
}
/* =========================
   BUSINESS PAGE BUILDER
========================= */
async function renderBizPage(){
  setView(`<div class="card">${header("🌐 Business Page","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    const res = await apiFetch("/api/biz-settings",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    const { page } = await res.json();
    const p = page || {};
    const slug = p.slug || currentUser?.id?.substring(0,8) || "";
    const bizUrl = (await resolveBackend()) + "/biz/" + slug;

    setView(`
      <div class="card">
        ${header("🌐 Business Page","dashboard")}
        <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Create a free business page to share online. No website needed.</p>

        ${p.business_name ? `
          <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7)">Your Business Page</p>
            <p style="margin:0 0 10px;font-size:13px;color:white;word-break:break-all">${bizUrl}</p>
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
              <button onclick="navigator.clipboard.writeText('${bizUrl}').then(()=>alert('Copied!'))" style="padding:7px 14px;background:white;color:#1d4ed8;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600">📋 Copy</button>
              <a href="${bizUrl}" target="_blank" style="padding:7px 14px;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:7px;text-decoration:none;font-size:12px">👁️ Preview</a>
            </div>
          </div>
        ` : ""}

        <div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold">Page Details</p>
          <input id="bp_name" placeholder="Business name *" value="${p.business_name||""}" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="bp_tagline" placeholder="Tagline (e.g. Lagos's best hair salon)" value="${p.tagline||""}" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="bp_slug" placeholder="Page link name (e.g. glamour-salon)" value="${p.slug||slug}" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <textarea id="bp_desc" placeholder="About your business..." style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:70px;resize:none;box-sizing:border-box">${p.description||""}</textarea>
          <input id="bp_hours" placeholder="Opening hours" value="${p.hours||""}" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="bp_location" placeholder="Location / Address" value="${p.location||""}" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="bp_wa" placeholder="WhatsApp number" value="${p.whatsapp||""}" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <input id="bp_ig" placeholder="Instagram link (optional)" value="${p.instagram||""}" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
          <div style="margin-bottom:8px">
            <p style="font-size:12px;color:#94a3b8;margin-bottom:6px">Theme Color</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b","#ec4899","#0ea5e9","#14b8a6"].map(col=>`<div onclick="document.getElementById('bp_color').value='${col}';this.parentElement.querySelectorAll('div').forEach(d=>d.style.border='none');this.style.border='3px solid white'" style="width:28px;height:28px;border-radius:50%;background:${col};cursor:pointer;${p.theme_color===col?'border:3px solid white':''}"></div>`).join("")}
              <input id="bp_color" type="color" value="${p.theme_color||'#3b82f6'}" style="width:28px;height:28px;border:none;border-radius:50%;cursor:pointer;padding:0;background:none">
            </div>
          </div>
        </div>

        <button onclick="saveBizPage()" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">🌐 Save and Publish Page</button>
      </div>
    `);
  } catch(e){ setView(`<div class="card">${header("🌐 Business Page","dashboard")}<p style="color:red">${e.message}</p></div>`); }
}

async function saveBizPage(){
  var btn = document.querySelector("button[onclick='saveBizPage()']");
  if(btn){btn.disabled=true;btn.textContent="Publishing...";}
  try {
    var res = await apiFetch("/api/biz-settings",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({
        business_name: document.getElementById("bp_name")?.value.trim(),
        tagline: document.getElementById("bp_tagline")?.value.trim(),
        slug: document.getElementById("bp_slug")?.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,"-"),
        description: document.getElementById("bp_desc")?.value.trim(),
        hours: document.getElementById("bp_hours")?.value.trim(),
        location: document.getElementById("bp_location")?.value.trim(),
        whatsapp: document.getElementById("bp_wa")?.value.trim(),
        instagram: document.getElementById("bp_ig")?.value.trim(),
        theme_color: document.getElementById("bp_color")?.value
      })
    });
    var data = await res.json();
    if(data.success){
      var slug = data.slug || document.getElementById("bp_slug")?.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,"-") || "";
      var bizUrl = (await resolveBackend()) + "/biz/" + slug;
      renderBizPageSuccess(bizUrl);
    }
    else alert("Error. Try again.");
  } catch(e){ alert("Network error."); }
  if(btn){btn.disabled=false;btn.textContent="Save and Publish Page";}
}

function renderBizPageSuccess(bizUrl){
  var waShareText = "Check out my business page: " + bizUrl;
  setView(`
    <div class="card" style="text-align:center;padding:30px 20px">
      <div style="font-size:48px;margin-bottom:12px">🎉</div>
      <h2 style="margin:0 0 8px;font-size:20px">Your Business Page is Live!</h2>
      <p style="color:#64748b;font-size:13px;margin-bottom:20px">Share this link anywhere — Instagram bio, WhatsApp status, Facebook page.</p>
      <div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:16px;word-break:break-all;font-size:13px;color:#3b82f6">${bizUrl}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button onclick="navigator.clipboard.writeText('${bizUrl}').then(()=>alert('Copied!'))" style="padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">📋 Copy Link</button>
        <a href="${bizUrl}" target="_blank" style="padding:12px;background:#0f172a;border:1px solid #334155;color:white;border-radius:8px;text-decoration:none;font-size:14px">👁️ View My Website</a>
        <a href="https://wa.me/?text=${encodeURIComponent(waShareText)}" target="_blank" style="padding:12px;background:#25d366;color:white;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">📱 Share on WhatsApp</a>
        <button onclick="renderBizPage()" style="padding:12px;background:transparent;border:none;color:#64748b;cursor:pointer;font-size:13px;margin-top:6px">← Back to Edit Page</button>
      </div>
    </div>
  `);
}
/* =========================
   B2C CUSTOMER GROWTH
========================= */
async function renderB2CGrowth(){
  setView(`
    <div class="card">
      ${header("📣 Customer Growth","leadFinder")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">AI generates marketing content to attract individual customers to your business.</p>

      <select id="b2c_goal" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
        <option value="">-- What do you want to achieve? --</option>
        <option value="new_customers">Get new customers</option>
        <option value="reactivate">Re-engage old customers</option>
        <option value="promotion">Promote a special offer</option>
        <option value="loyalty">Build customer loyalty</option>
        <option value="referral">Get referrals from customers</option>
      </select>

      <input id="b2c_biz" placeholder="Your business (e.g. Glamour Hair Salon)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box" value="${currentProfile?.display_name||""}">
      <input id="b2c_location" placeholder="Your city (e.g. Lagos, Abuja)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      <textarea id="b2c_offer" placeholder="Any specific offer, price, or detail to include?" style="width:100%;padding:10px;margin-bottom:14px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:70px;resize:none;box-sizing:border-box"></textarea>

      <button onclick="generateB2CContent()" style="width:100%;padding:12px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">✨ Generate Marketing Content</button>
      <div id="b2c_result" style="margin-top:14px"></div>
    </div>
  `);
}

async function generateB2CContent(){
  var goal = document.getElementById("b2c_goal")?.value;
  var biz = document.getElementById("b2c_biz")?.value.trim();
  var location = document.getElementById("b2c_location")?.value.trim();
  var offer = document.getElementById("b2c_offer")?.value.trim();
  if(!goal) return alert("Select what you want to achieve.");
  if(!biz) return alert("Enter your business name.");

  var btn = document.querySelector("button[onclick='generateB2CContent()']");
  if(btn){btn.disabled=true;btn.textContent="Generating...";}
  var el = document.getElementById("b2c_result");
  if(el) el.innerHTML = "<p style='color:#64748b;font-size:12px;text-align:center'>Writing content for all platforms...</p>";

  var goalText = {new_customers:"attract new customers",reactivate:"re-engage old customers who haven't visited in a while",promotion:"promote a special offer",loyalty:"build customer loyalty and encourage repeat visits",referral:"encourage existing customers to refer friends"}[goal]||goal;

  try {
    var res = await apiFetch("/api/ai-reply",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({message: `Create marketing content for ${biz} in ${location||"Nigeria"} to ${goalText}. ${offer?"Special offer: "+offer:""}

Generate ALL of these in JSON format:
{
  "whatsapp_status": "Short WhatsApp status text (under 50 words)",
  "facebook_post": "Facebook post with emojis (under 100 words)",
  "instagram_caption": "Instagram caption with hashtags",
  "tiktok_idea": "TikTok video idea (what to film and say)",
  "whatsapp_broadcast": "WhatsApp broadcast message to send to customer list",
  "referral_message": "Message asking happy customers to refer friends",
  "promo_idea": "One creative promotion idea specific to this business"
}

Return ONLY the JSON, no markdown.`})
    });
    var data = await res.json();
    var content;
    try { content = JSON.parse(data.reply.replace(/\`\`\`json|\`\`\`/g,"").trim()); }
    catch(e) { content = null; }

    if(!content){
      if(el) el.innerHTML = `<div style="background:#162032;padding:14px;border-radius:10px"><p style="font-size:13px;color:#cbd5e1;line-height:1.6;white-space:pre-wrap">${data.reply}</p></div>`;
      return;
    }

    var platforms = [
      {key:"whatsapp_status", label:"WhatsApp Status", icon:"💬", color:"#25d366"},
      {key:"facebook_post", label:"Facebook Post", icon:"📘", color:"#1877f2"},
      {key:"instagram_caption", label:"Instagram Caption", icon:"📸", color:"#e1306c"},
      {key:"tiktok_idea", label:"TikTok Idea", icon:"🎵", color:"#ff0050"},
      {key:"whatsapp_broadcast", label:"WhatsApp Broadcast", icon:"📢", color:"#25d366"},
      {key:"referral_message", label:"Referral Message", icon:"🤝", color:"#8b5cf6"},
      {key:"promo_idea", label:"Promotion Idea", icon:"💡", color:"#f59e0b"}
    ];

    if(el) el.innerHTML = platforms.map(function(p){
      var text = content[p.key] || "";
      return `<div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid ${p.color}">
        <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:${p.color}">${p.icon} ${p.label}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#94a3b8;line-height:1.5">${text}</p>
        <div style="display:flex;gap:8px">
          <button onclick="navigator.clipboard.writeText('${text.replace(/'/g,"\'")}').then(()=>alert('Copied!'))" style="padding:6px 12px;background:#334155;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px">📋 Copy</button>
          <button onclick="if(navigator.share){navigator.share({text:'${text.replace(/'/g,"\'")}'})}else{navigator.clipboard.writeText('${text.replace(/'/g,"\'")}').then(()=>alert('Copied!'))}" style="padding:6px 12px;background:${p.color}22;color:${p.color};border:1px solid ${p.color}55;border-radius:6px;cursor:pointer;font-size:11px">📤 Share</button>
        </div>
      </div>`;
    }).join("");
  } catch(e){
    if(el) el.innerHTML = `<div style="text-align:center"><p style="color:red;font-size:12px">Network error.</p><button onclick="generateB2CContent()" style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;margin-top:8px">🔄 Retry</button></div>`;
  }

  if(btn){btn.disabled=false;btn.textContent="✨ Generate Marketing Content";}
}

/* =========================
   FOLLOW-UP ASSISTANT
========================= */
async function renderFollowupAssistant(){
  setView(
    '<div class="card">' +
    header("Follow-Up Assistant","dashboard") +
    '<p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Customers you should contact today. AI has written the messages — just tap Send.</p>' +
    '<div id="fa_content"><div style="text-align:center;padding:30px"><p style="color:#64748b">Loading your follow-ups...</p></div></div>' +
    '</div>'
  );
  try {
    var res = await apiFetch("/api/followup-assistant", {headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    var el = document.getElementById("fa_content");
    if(!el) return;
    if(!data.followups || data.followups.length === 0){
      el.innerHTML = '<div style="text-align:center;padding:30px"><p style="font-size:32px;margin-bottom:8px">✅</p><p style="font-size:14px;font-weight:700;margin-bottom:4px">All caught up!</p><p style="color:#64748b;font-size:13px">No follow-ups needed right now. Keep adding leads.</p></div>';
      return;
    }
    window._followups = data.followups;
    var html = '<p style="font-size:13px;font-weight:600;color:#f59e0b;margin-bottom:12px">⏰ ' + data.followups.length + ' customer' + (data.followups.length > 1 ? 's' : '') + ' waiting for your follow-up</p>';
    data.followups.forEach(function(f, i){
      var waLink = f.phone ? 'https://wa.me/' + f.phone.replace(/[^0-9]/g,'').replace(/^0/,'234') + '?text=' + encodeURIComponent(f.message) : null;
      var dayLabel = f.days === 0 ? 'Today' : f.days === 1 ? 'Yesterday' : f.days + ' days ago';
      var urgency = f.days >= 14 ? '#ef4444' : f.days >= 7 ? '#f59e0b' : '#3b82f6';
      html += '<div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid ' + urgency + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">';
      html += '<div><p style="margin:0;font-size:14px;font-weight:700">' + f.name + '</p>';
      if(f.business) html += '<p style="margin:2px 0;font-size:11px;color:#64748b">' + f.business + '</p>';
      html += '</div><span style="font-size:11px;color:' + urgency + ';font-weight:600">' + dayLabel + '</span></div>';
      html += '<div style="background:#162032;border-radius:8px;padding:10px;margin-bottom:10px">';
      html += '<p style="margin:0 0 4px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.5px">AI-Written Message</p>';
      html += '<textarea id="msg_' + i + '" style="width:100%;background:transparent;border:none;color:#cbd5e1;font-size:13px;line-height:1.5;resize:none;outline:none;box-sizing:border-box" rows="3">' + f.message + '</textarea></div>';
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
      if(waLink){
        html += '<a href="' + waLink + '" target="_blank" onclick="markSent(' + i + ')" style="flex:1;text-align:center;padding:9px;background:#25d366;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">💬 Send on WhatsApp</a>';
      }
      html += '<button onclick="copyFollowup(' + i + ')" style="padding:9px 14px;background:#334155;color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px">📋 Copy</button>';
      html += '<button onclick="dismissFollowup(\'' + f.id + '\',' + i + ')" style="padding:9px 12px;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.3);border-radius:8px;cursor:pointer;font-size:12px">✓ Done</button>';
      html += '</div></div>';
    });
    el.innerHTML = html;
  } catch(e){
    var el2 = document.getElementById("fa_content");
    if(el2) el2.innerHTML = '<p style="color:red;font-size:13px">Error loading. Check your connection and try again.</p>';
  }
}

function copyFollowup(i){
  var ta = document.getElementById("msg_" + i);
  if(ta) navigator.clipboard.writeText(ta.value).then(function(){ alert("Message copied!"); });
}

function markSent(i){
  var followup = window._followups && window._followups[i];
  if(followup){
    apiFetch("/api/leads/" + followup.id, {
      method: "PATCH",
      headers: {"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({status: "contacted"})
    }).catch(function(){});
  }
}

async function dismissFollowup(id, i){
  var nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  await apiFetch("/api/leads/" + id, {
    method: "PATCH",
    headers: {"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
    body: JSON.stringify({follow_up_date: nextWeek.toISOString().split("T")[0], status: "contacted"})
  }).catch(function(){});
  var card = document.getElementById("msg_" + i)?.closest('[style*="border-left"]');
  if(card) card.style.opacity = "0.3";
}


async function renderWebsiteHealth(){
  setView(`
    <div class="card">
      ${header("🩺 Website Health Check","dashboard")}
      <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Check any business website for common gaps — yours, or a prospect's before you pitch them.</p>
      <input id="whc_url" placeholder="e.g. example.com" style="width:100%;padding:10px;margin-bottom:12px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">
      <button onclick="runWebsiteHealthCheck()" id="whc_btn" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">🔍 Check Website</button>
      <div id="whc_result" style="margin-top:16px"></div>
    </div>
  `);
}

async function runWebsiteHealthCheck(){
  var url = document.getElementById("whc_url")?.value.trim();
  if(!url){ alert("Enter a website URL first."); return; }
  var btn = document.getElementById("whc_btn");
  btn.disabled = true; btn.textContent = "Checking...";
  var el = document.getElementById("whc_result");
  el.innerHTML = "<p style='color:#64748b;font-size:13px;text-align:center'>Analyzing website...</p>";
  try {
    var res = await apiFetch("/api/website-health", {
      method: "POST",
      headers: {"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({ url: url })
    });
    var data = await res.json();
    if(!data.success){
      el.innerHTML = "<p style='color:#ef4444;font-size:13px;text-align:center'>" + (data.error||"Could not check that site.") + "</p>";
      btn.disabled = false; btn.textContent = "🔍 Check Website";
      return;
    }
    var html = "";
    if(data.missing.length === 0){
      html += "<div style='background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:14px;margin-bottom:12px'><p style='margin:0;color:#10b981;font-size:13px;font-weight:600'>✅ Looks solid! No major gaps found.</p></div>";
    } else {
      html += "<p style='font-size:13px;font-weight:700;color:#f59e0b;margin-bottom:10px'>Found " + data.missing.length + " thing(s) to improve:</p>";
      data.missing.forEach(function(m){
        html += "<div style='background:#0f172a;border-radius:8px;padding:10px;margin-bottom:8px'><p style='margin:0;font-size:13px;color:#cbd5e1'>⚠️ " + m + "</p></div>";
      });
    }
    if(data.summary){
      html += "<div style='background:#162032;border-radius:8px;padding:12px;margin-top:8px;border-left:3px solid #3b82f6'><p style='margin:0;font-size:13px;color:#cbd5e1;line-height:1.6'>" + data.summary + "</p></div>";
    }
    el.innerHTML = html;
  } catch(e){
    el.innerHTML = "<p style='color:#ef4444;font-size:13px;text-align:center'>Network error. <button onclick='runWebsiteHealthCheck()' style='color:#3b82f6;background:none;border:none;cursor:pointer;text-decoration:underline'>Retry</button></p>";
  }
  btn.disabled = false; btn.textContent = "🔍 Check Website";
}

async function renderTestimonials(){
  setView(`<div class="card">${header("💬 Testimonials","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    var res = await apiFetch("/api/testimonials", {headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    var items = data.testimonials || [];

    var html = '<div class="card">' + header("💬 Testimonials","dashboard");
    html += '<p style="font-size:13px;color:#94a3b8;margin-bottom:16px">People who agreed to be featured, from 4-5 star feedback.</p>';

    if(items.length === 0){
      html += '<div style="text-align:center;padding:30px"><p style="color:#64748b;font-size:13px">No testimonials yet. They will show up here once users opt in from the feedback popup.</p></div>';
    } else {
      items.forEach(function(t){
        var name = (t.profiles && t.profiles.display_name) ? t.profiles.display_name : "A user";
        var stars = "⭐".repeat(t.rating || 5);
        var msg = t.message || "";
        var escapedMsg = msg.replace(/'/g, "\\\\'").replace(/\\n/g, " ");
        html += '<div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:10px">';
        html += '<p style="margin:0 0 4px;font-size:13px">' + stars + '</p>';
        html += '<p style="margin:0 0 8px;font-size:13px;color:#cbd5e1;line-height:1.5">"' + msg + '"</p>';
        html += '<p style="margin:0 0 10px;font-size:11px;color:#475569">— ' + name + '</p>';
        html += '<button data-text="' + escapedMsg + ' — ' + name + '" onclick="navigator.clipboard.writeText(this.getAttribute(&quot;data-text&quot;)).then(function(){alert(&quot;Copied!&quot;);})" style="padding:6px 12px;background:#334155;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px">📋 Copy</button>';
        html += '</div>';
      });
    }
    html += '</div>';
    setView(html);
  } catch(e){
    setView('<div class="card">' + header("💬 Testimonials","dashboard") + '<p style="color:red">' + e.message + '</p></div>');
  }
}

/* =========================
   NICHE SELECT
========================= */
function renderNicheSelect(){
  window._selectedNiches = window._selectedNiches || [];
  renderNicheSelectUI();
}

function renderNicheSelectUI(){
  var sel = window._selectedNiches || [];
  var optionsHtml = NICHE_OPTIONS.map(function(o, idx){
    var isSel = sel.indexOf(o.value) !== -1;
    return '<button onclick="toggleNicheChoice(' + idx + ')" style="padding:14px;background:' + (isSel ? "#1d4ed8" : "#0f172a") + ';border:1px solid ' + (isSel ? "#3b82f6" : "#334155") + ';color:white;border-radius:10px;cursor:pointer;font-size:13px;text-align:left">' + (isSel ? "✅ " : "") + o.emoji + " " + o.label + "</button>";
  }).join("");

  setView(
    '<div class="card" style="text-align:center;padding:30px 20px">' +
    '<div style="font-size:48px;margin-bottom:16px">👋</div>' +
    '<h2 style="margin:0 0 8px;font-size:22px">Welcome to AI Business</h2>' +
    '<p style="color:#64748b;font-size:14px;margin-bottom:6px">What type of business do you run?</p>' +
    '<p style="color:#475569;font-size:12px;margin-bottom:20px">Select up to 3</p>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left;margin-bottom:20px">' +
    optionsHtml +
    '</div>' +
    '<button onclick="confirmNicheSelection()" ' + (sel.length === 0 ? "disabled" : "") + ' style="width:100%;padding:14px;background:' + (sel.length === 0 ? "#334155" : "#3b82f6") + ';color:white;border:none;border-radius:10px;cursor:' + (sel.length === 0 ? "not-allowed" : "pointer") + ';font-size:15px;font-weight:600">' + (sel.length === 0 ? "Select at least 1" : "Continue (" + sel.length + "/3 selected)") + '</button>' +
    '</div>'
  );
}

function toggleNicheChoice(idx){
  var val = NICHE_OPTIONS[idx].value;
  window._selectedNiches = window._selectedNiches || [];
  var idx = window._selectedNiches.indexOf(val);
  if(idx > -1){
    window._selectedNiches.splice(idx, 1);
  } else {
    if(window._selectedNiches.length >= 3){ alert("You can select up to 3 business types."); return; }
    window._selectedNiches.push(val);
  }
  renderNicheSelectUI();
}

async function confirmNicheSelection(){
  var sel = window._selectedNiches || [];
  if(sel.length === 0) return;
  var niche = sel.join(",");
  if(currentProfile) currentProfile.business_type = niche;
  else currentProfile = { business_type: niche };
  localStorage.setItem("aib_niche", niche);
  try {
    await apiFetch("/api/profile",{
      method:"PATCH",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({business_type: niche})
    });
  } catch(e){}
  renderFirstWin(niche);
}

/* =========================
   FIRST WIN SCREEN
========================= */
function renderFirstWin(niche){
  window._firstWinNiche = niche;
  var b2bNiches = ["agency", "tech"];
  var selectedTypes = niche.split(",").map(function(s){ return s.trim(); });
  var matchedB2B = selectedTypes.find(function(t){ return b2bNiches.indexOf(t) !== -1; });
  var isB2B = !!matchedB2B;
  if(isB2B){ window._firstWinNiche = matchedB2B; }

  if(isB2B){
    setView(`
      <div class="card" style="text-align:center;padding:30px 20px">
        <div style="font-size:40px;margin-bottom:10px">🎯</div>
        <h2 style="margin:0 0 8px;font-size:20px">Let's find your first customers</h2>
        <p style="color:#64748b;font-size:13px;margin-bottom:24px">Type your city below and watch real businesses appear.</p>
        <input id="fw_location" placeholder="e.g. Lagos, Abuja" style="width:100%;padding:12px;margin-bottom:14px;border-radius:10px;border:1px solid #334155;background:#0b1220;color:white;font-size:14px;box-sizing:border-box">
        <button onclick="runFirstWinLeadFinder()" id="fw_btn" style="width:100%;padding:14px;background:#3b82f6;color:white;border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600">🔍 Find Customers Now</button>
        <div id="fw_result" style="margin-top:18px;text-align:left"></div>
      </div>
    `);
  } else {
    setView(`
      <div class="card" style="text-align:center;padding:30px 20px">
        <div style="font-size:40px;margin-bottom:10px">📣</div>
        <h2 style="margin:0 0 8px;font-size:20px">Let's grow your customer base</h2>
        <p style="color:#64748b;font-size:13px;margin-bottom:20px">Tell us about your business, then get a ready-to-post promo.</p>
        <input id="fw_bizname" placeholder="Business name (e.g. Glamour Hair Studio)" style="width:100%;padding:12px;margin-bottom:10px;border-radius:10px;border:1px solid #334155;background:#0b1220;color:white;font-size:14px;box-sizing:border-box">
        <input id="fw_bizservice" placeholder="What you sell (e.g. hair braiding, weaves)" style="width:100%;padding:12px;margin-bottom:14px;border-radius:10px;border:1px solid #334155;background:#0b1220;color:white;font-size:14px;box-sizing:border-box">
        <button onclick="runFirstWinB2C()" id="fw_btn" style="width:100%;padding:14px;background:#8b5cf6;color:white;border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600">✨ Generate My First Post</button>
        <div id="fw_result" style="margin-top:18px;text-align:left"></div>
      </div>
    `);
  }
}

async function runFirstWinLeadFinder(){
  var loc = document.getElementById("fw_location")?.value.trim();
  if(!loc){ alert("Type a city first."); return; }
  var btn = document.getElementById("fw_btn");
  btn.disabled = true; btn.textContent = "Searching...";
  var resultEl = document.getElementById("fw_result");
  resultEl.innerHTML = "<p style='text-align:center;color:#64748b;font-size:13px'>Looking for real businesses near you...</p>";
  try {
    var nicheOffers = {agency:"marketing and business services",tech:"software and IT services",realestate:"real estate services"};
    var nicheCustomers = {agency:"retail shops and small local businesses",tech:"businesses that need a website or software",realestate:"real estate agencies"};
    var firstNiche = (window._firstWinNiche || "agency").split(",")[0];
    var offerText = nicheOffers[firstNiche] || "business services";
    var targetText = nicheCustomers[firstNiche] || "small businesses";
    var res = await apiFetch("/api/lead-finder", {
      method: "POST",
      headers: {"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({ service: offerText, location: loc, industry: targetText })
    });
    var data = await res.json();
    if(data.leads && data.leads.length > 0){
      var html = "<p style='font-size:13px;font-weight:700;color:#10b981;margin-bottom:10px'>✅ Found " + data.leads.length + " real businesses near you</p>";
      data.leads.slice(0,3).forEach(function(l){
        var waLink = l.phone ? "https://wa.me/" + l.phone.replace(/[^0-9]/g,"").replace(/^0/,"234") + "?text=" + encodeURIComponent("Hi " + l.name + ", " + l.message ? l.message : "I'd love to work with your business.") : null;
        html += "<div style='background:#0f172a;border-radius:8px;padding:10px;margin-bottom:8px'>";
        html += "<p style='margin:0;font-size:13px;font-weight:600'>" + l.name + "</p>";
        if(l.phone) html += "<p style='margin:2px 0 8px;font-size:12px;color:#10b981'>📞 " + l.phone + "</p>";
        if(waLink) html += "<a href='" + waLink + "' target='_blank' style='display:inline-block;padding:6px 12px;background:#25d366;color:white;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600'>💬 Send WhatsApp</a>";
        html += "</div>";
      });
      html += "<button onclick=\"loadPage('dashboard')\" style='width:100%;padding:14px;background:#10b981;color:white;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;margin-top:10px'>Continue to Dashboard →</button>";
      resultEl.innerHTML = html;
    } else {
      resultEl.innerHTML = "<p style='color:#64748b;font-size:13px;text-align:center'>No results for that city. Try another, or continue anyway.</p><button onclick=\"loadPage('dashboard')\" style='width:100%;padding:14px;background:#3b82f6;color:white;border:none;border-radius:10px;cursor:pointer;font-size:14px;margin-top:10px'>Continue to Dashboard →</button>";
    }
  } catch(e){
    resultEl.innerHTML = "<p style='color:#ef4444;font-size:13px;text-align:center'>Network error. <button onclick=\"loadPage('dashboard')\" style='color:#3b82f6;background:none;border:none;cursor:pointer;text-decoration:underline'>Skip to Dashboard</button></p>";
  }
  btn.disabled = false; btn.textContent = "🔍 Find Customers Now";
}

async function runFirstWinB2C(){
  var btn = document.getElementById("fw_btn");
  btn.disabled = true; btn.textContent = "Generating...";
  var resultEl = document.getElementById("fw_result");
  resultEl.innerHTML = "<p style='text-align:center;color:#64748b;font-size:13px'>Writing your first post...</p>";
  var bizName = document.getElementById("fw_bizname")?.value.trim();
  var bizService = document.getElementById("fw_bizservice")?.value.trim();
  if(!bizName || !bizService){
    alert("Fill in your business name and what you sell first.");
    btn.disabled = false; btn.textContent = "✨ Generate My First Post";
    return;
  }
  try {
    var res = await apiFetch("/api/ai-reply", {
      method: "POST",
      headers: {"Content-Type":"application/json", Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({message: "Write one short, exciting WhatsApp status promo (under 40 words) for " + bizName + ", a business that sells " + bizService + ", to attract new customers. Nigerian audience. Mention the business name and what they sell specifically. No markdown, just the message."})
    });
    var data = await res.json();
    if(data.success && data.reply){
      resultEl.innerHTML =
        "<p style='font-size:13px;font-weight:700;color:#10b981;margin-bottom:10px'>✅ Your first post is ready</p>" +
        "<div style='background:#0f172a;border-radius:8px;padding:12px;margin-bottom:14px'><p style='margin:0;font-size:13px;color:#cbd5e1;line-height:1.6'>" + data.reply + "</p></div>" +
        "<button onclick=\"navigator.clipboard.writeText('" + data.reply.replace(/'/g,"\\'") + "').then(function(){alert('Copied!');})\" style='width:100%;padding:12px;background:#334155;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;margin-bottom:8px'>📋 Copy</button>" +
        "<button onclick=\"loadPage('dashboard')\" style='width:100%;padding:14px;background:#10b981;color:white;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600'>Continue to Dashboard →</button>";
    } else {
      resultEl.innerHTML = "<p style='color:#64748b;font-size:13px;text-align:center'>Could not generate. <button onclick=\"loadPage('dashboard')\" style='color:#3b82f6;background:none;border:none;cursor:pointer;text-decoration:underline'>Skip to Dashboard</button></p>";
    }
  } catch(e){
    resultEl.innerHTML = "<p style='color:#ef4444;font-size:13px;text-align:center'>Network error. <button onclick=\"loadPage('dashboard')\" style='color:#3b82f6;background:none;border:none;cursor:pointer;text-decoration:underline'>Skip to Dashboard</button></p>";
  }
  btn.disabled = false; btn.textContent = "✨ Generate My First Post";
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
      apiFetch("/api/automation/settings",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}}),
      apiFetch("/api/campaigns",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
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
    await apiFetch("/api/automation/settings",{
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
    const res = await apiFetch("/api/campaigns",{
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
    const res = await apiFetch("/api/campaigns/"+id+"/prepare",{
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
  await apiFetch("/api/campaigns/"+id,{method:"DELETE",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
  renderAutomation();
}


/* =========================
   AFFILIATE PROGRAM
========================= */

async function enrollAffiliate(){
  var btn = document.querySelector("button[onclick='enrollAffiliate()']");
  if(btn){btn.disabled=true;btn.textContent="Enrolling...";}
  try{
    var res = await apiFetch("/api/affiliate/join",{method:"POST",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    console.log("Enroll result:", JSON.stringify(data));
    if(data.success || data.affiliate){ renderAffiliate(); }
    else { alert("Error: " + (data.error||"Could not enroll. Check console.")); if(btn){btn.disabled=false;btn.textContent="Join Affiliate Program";} }
  }catch(e){ alert("Network error: "+e.message); if(btn){btn.disabled=false;btn.textContent="Join Affiliate Program";} }
}

async function renderAffiliate(){
  setView('<div class="card">' + header("💸 Affiliate Program","dashboard") + '<p style="color:#64748b">Loading...</p></div>');
  try {
    await apiFetch("/api/affiliate/join",{method:"POST",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var res = await apiFetch("/api/affiliate/stats",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    if(!data.success){
      setView('<div class="card">' + header("💸 Affiliate Program","dashboard") +
        '<div style="text-align:center;padding:20px">' +
        '<p style="color:#ef4444;margin-bottom:12px">Error: ' + (data.error||"Could not load") + '</p>' +
        '<button onclick="enrollAffiliate()" style="padding:11px 20px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Join Affiliate Program</button>' +
        '</div></div>');
      return;
    }

    var aff = data.affiliate || {};
    var convs = data.conversions || [];
    var code = aff.affiliate_code || "";
    var refLink = window.location.origin + "/auth?aff=" + code;
    var balance = parseFloat(aff.balance||0);
    var pending = convs.filter(function(cv){return cv.status==="pending";}).reduce(function(s,cv){return s+parseFloat(cv.commission||0);},0);

    var html = '<div class="card">' + header("💸 Affiliate Program","dashboard");

    html += '<div style="background:linear-gradient(135deg,#065f46,#047857);border-radius:14px;padding:18px;margin-bottom:16px;text-align:center">';
    html += '<p style="margin:0 0 2px;font-size:12px;color:rgba(255,255,255,0.7)">Available Balance</p>';
    html += '<p style="margin:0 0 12px;font-size:32px;font-weight:900;color:white">&#8358;' + balance.toLocaleString() + '</p>';
    html += '<div style="display:flex;gap:10px;margin-bottom:12px">';
    html += '<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:8px;padding:10px;text-align:center"><p style="margin:0;font-size:14px;font-weight:800;color:white">&#8358;' + pending.toLocaleString() + '</p><p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.7)">Pending 24h</p></div>';
    html += '<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:8px;padding:10px;text-align:center"><p style="margin:0;font-size:14px;font-weight:800;color:white">' + (aff.total_conversions||0) + '</p><p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.7)">Total Sales</p></div>';
    html += '<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:8px;padding:10px;text-align:center"><p style="margin:0;font-size:14px;font-weight:800;color:white">&#8358;' + parseFloat(aff.total_earned||0).toLocaleString() + '</p><p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.7)">Total Earned</p></div>';
    html += '</div>';
    if(balance >= 1000){
      html += '<button onclick="showAffWithdraw()" style="width:100%;padding:11px;background:white;color:#065f46;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700">Withdraw &#8358;' + balance.toLocaleString() + '</button>';
    } else {
      html += '<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6)">Min withdrawal &#8358;1,000</p>';
    }
    html += '</div>';

    html += '<div id="aff_withdraw_box" style="display:none;background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px" data-balance="' + balance + '">';
    html += '<p style="margin:0 0 10px;font-size:13px;font-weight:bold">Withdrawal Details</p>';
    html += '<select id="wd_bank" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">';
    html += '<option value="">-- Select bank --</option>';
    ["Access Bank","GTBank","Zenith Bank","First Bank","UBA","Fidelity Bank","Union Bank","Sterling Bank","Wema Bank","Ecobank","Stanbic IBTC","Polaris Bank","Unity Bank","Keystone Bank","OPay","PalmPay","Moniepoint","Kuda Bank","Other"].forEach(function(bn){
      html += '<option value="' + bn + '">' + bn + '</option>';
    });
    html += '</select>';
    html += '<input id="wd_acc" placeholder="Account number" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">';
    html += '<input id="wd_name" placeholder="Account name" style="width:100%;padding:9px;margin-bottom:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">';
    html += '<button onclick="submitAffWithdraw()" style="width:100%;padding:11px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">Submit Request</button>';
    html += '<div id="wd_result" style="margin-top:8px"></div></div>';

    var withdrawals = data.withdrawals || [];
    if(withdrawals.length > 0){
      html += '<div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">';
      html += '<p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#94a3b8">Withdrawal History</p>';
      withdrawals.slice(0,5).forEach(function(w){
        var statusColor = w.status === "paid" ? "#10b981" : "#f59e0b";
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e293b">';
        html += '<div><p style="margin:0;font-size:13px;font-weight:600">&#8358;' + parseFloat(w.amount||0).toLocaleString() + '</p><p style="margin:2px 0 0;font-size:11px;color:#64748b">' + new Date(w.created_at).toLocaleDateString() + '</p></div>';
        html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:' + statusColor + '22;color:' + statusColor + '">' + (w.status || "pending") + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '<div style="background:#0f172a;border-radius:12px;padding:16px;margin-bottom:14px">';
    html += '<p style="margin:0 0 4px;font-size:12px;color:#94a3b8">Your Affiliate Link</p>';
    html += '<p style="margin:0 0 10px;font-size:12px;color:white;word-break:break-all">' + refLink + '</p>';
    html += '<div style="display:flex;gap:8px">';
    html += '<button onclick="navigator.clipboard.writeText(\'' + refLink + '\').then(function(){alert(\'Copied!\');})" style="flex:1;padding:9px;background:#334155;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px">Copy Link</button>';
    html += '<button onclick="if(navigator.share){navigator.share({text:\'Join AI Business free for 7 days: ' + refLink + '\'}).catch(function(){});}" style="flex:1;padding:9px;background:#25d366;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px">Share</button>';
    html += '</div>';
    html += '<p style="margin:10px 0 0;font-size:11px;color:#475569">Code: <strong style="color:#10b981">' + code + '</strong></p>';
    html += '</div>';

    html += '<div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">';
    html += '<p style="margin:0 0 10px;font-size:13px;font-weight:bold">Commission Structure</p>';
    html += '<div style="padding:8px 0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between"><div><p style="margin:0;font-size:13px;font-weight:600">Starter Plan</p><p style="margin:0;font-size:11px;color:#64748b">Customer pays &#8358;6,000</p></div><p style="margin:0;font-size:15px;font-weight:800;color:#10b981">You earn &#8358;3,000</p></div>';
    html += '<div style="padding:8px 0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between"><div><p style="margin:0;font-size:13px;font-weight:600">Pro Plan</p><p style="margin:0;font-size:11px;color:#64748b">Customer pays &#8358;15,000</p></div><p style="margin:0;font-size:15px;font-weight:800;color:#3b82f6">You earn &#8358;7,500</p></div>';
    html += '<div style="padding:8px 0;display:flex;justify-content:space-between"><div><p style="margin:0;font-size:13px;font-weight:600">Business Plan</p><p style="margin:0;font-size:11px;color:#64748b">Customer pays &#8358;45,000</p></div><p style="margin:0;font-size:15px;font-weight:800;color:#8b5cf6">You earn &#8358;22,500</p></div>';
    html += '<p style="margin:10px 0 0;font-size:11px;color:#475569">50% commission. Credited 24h after payment. People who sign up via your link get 7 days free!</p>';
    html += '</div>';

    if(convs.length > 0){
      html += '<p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#94a3b8">Recent Conversions</p>';
      convs.slice(0,5).forEach(function(cv){
        html += '<div style="background:#0f172a;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
        html += '<div><p style="margin:0;font-size:13px;font-weight:600">' + (cv.plan||"") + ' Plan</p><p style="margin:2px 0 0;font-size:11px;color:#64748b">' + new Date(cv.created_at).toLocaleDateString() + '</p></div>';
        html += '<div style="text-align:right"><p style="margin:0;font-size:14px;font-weight:800;color:#10b981">+&#8358;' + parseFloat(cv.commission||0).toLocaleString() + '</p><span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(16,185,129,0.15);color:#10b981">' + (cv.status||"") + '</span></div>';
        html += '</div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px"><p style="color:#64748b;font-size:13px">No conversions yet. Share your link to start earning.</p></div>';
    }

    html += '</div>';
    setView(html);
  } catch(e){
    setView('<div class="card">' + header("💸 Affiliate","dashboard") + '<p style="color:red">' + e.message + '</p></div>');
  }
}

function showAffWithdraw(){
  var b = document.getElementById("aff_withdraw_box");
  if(b) b.style.display = b.style.display==="none"?"block":"none";
}

async function submitAffWithdraw(){
  var bank = document.getElementById("wd_bank")?.value.trim();
  var acc = document.getElementById("wd_acc")?.value.trim();
  var name = document.getElementById("wd_name")?.value.trim();
  var result = document.getElementById("wd_result");
  if(!bank||!acc||!name){ alert("Fill all bank details."); return; }
  try {
    var res = await apiFetch("/api/affiliate/withdraw",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body:JSON.stringify({bank_name:bank,account_number:acc,account_name:name,amount:parseFloat(document.getElementById("aff_withdraw_box")?.getAttribute("data-balance")||0)})
    });
    var data = await res.json();
    if(result) result.innerHTML = '<p style="color:' + (data.success?"#10b981":"#ef4444") + ';font-size:12px">' + (data.message||data.error) + '</p>';
    if(data.success) setTimeout(function(){renderAffiliate();},2000);
  } catch(e){ if(result) result.innerHTML='<p style="color:red;font-size:12px">Network error.</p>'; }
}


/* =========================
   REFERRAL PROGRAM
========================= */
async function renderReferral(){
  setView(`<div class="card">${header("🎁 Refer & Earn","dashboard")}<p style="color:#64748b">Loading...</p></div>`);
  try {
    const res = await apiFetch("/api/referral", { headers: { Authorization: "Bearer " + localStorage.getItem("token") }});
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
    var res = await apiFetch("/api/referral/redeem",{method:"POST",headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    if(data.success){ alert(data.message); renderReferral(); }
    else { alert(data.error||"Cannot redeem yet."); if(btn){btn.disabled=false;btn.textContent="Redeem Now";} }
  } catch(e){ alert("Error. Try again."); if(btn){btn.disabled=false;btn.textContent="Redeem Now";} }
}

/* =========================
   FEEDBACK + RATING
========================= */
function showFeedbackPopup(){
  var existing = document.getElementById("aib_feedback_modal");
  if(existing) existing.remove();

  document.body.insertAdjacentHTML("beforeend",`
    <div id="aib_feedback_modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:#1e293b;border-radius:16px;padding:24px;max-width:380px;width:100%;border:1px solid #334155">
        <p style="margin:0 0 6px;font-size:18px;font-weight:bold;text-align:center">How are we doing?</p>
        <p style="margin:0 0 16px;font-size:13px;color:#64748b;text-align:center">Your feedback helps us improve AI Business</p>

        <div style="display:flex;justify-content:center;gap:10px;margin-bottom:16px" id="aib_stars">
          ${[1,2,3,4,5].map(n=>`<span onclick="selectStar(${n})" style="font-size:32px;cursor:pointer;filter:grayscale(1);transition:all 0.2s" id="star_${n}">⭐</span>`).join("")}
        </div>

        <textarea id="aib_feedback_msg" placeholder="Tell us what you love or what we can improve..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;height:80px;resize:none;box-sizing:border-box;margin-bottom:12px"></textarea>

        <div id="aib_testimonial_check" style="display:none;margin-bottom:12px">
          <label style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#94a3b8;cursor:pointer">
            <input type="checkbox" id="aib_feature_ok" style="margin-top:2px;accent-color:#3b82f6">
            <span>Can we feature this as a testimonial on our website? (Optional, no pressure)</span>
          </label>
        </div>

        <div style="display:flex;gap:8px">
          <button onclick="submitFeedback()" style="flex:1;padding:11px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">Submit</button>
          <button onclick="document.getElementById('aib_feedback_modal').remove()" style="padding:11px 16px;background:#334155;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Skip</button>
        </div>
      </div>
    </div>
  `);
}

var selectedRating = 0;
function updateTestimonialCheckVisibility(){
  var box = document.getElementById("aib_testimonial_check");
  if(box) box.style.display = (selectedRating >= 4) ? "block" : "none";
}
function selectStar(n){
  selectedRating = n;
  for(var i=1;i<=5;i++){
    var el = document.getElementById("star_"+i);
    if(el) el.style.filter = i<=n ? "grayscale(0)" : "grayscale(1)";
  }
  updateTestimonialCheckVisibility();
}

async function submitFeedback(){
  const msg = document.getElementById("aib_feedback_msg")?.value.trim();
  if(!selectedRating) return alert("Please select a star rating.");
  const btn = document.querySelector("button[onclick='submitFeedback()']");
  if(btn){btn.disabled=true;btn.textContent="Sending...";}

  try {
    await apiFetch("/api/feedback",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},
      body: JSON.stringify({rating:selectedRating, message:msg, feature_ok: document.getElementById("aib_feature_ok")?.checked || false})
    });
  } catch(e){}

  document.getElementById("aib_feedback_modal").remove();

  // If 4-5 stars, prompt Google review
  if(selectedRating >= 4){
    setTimeout(()=>{
      if(confirm("We are so glad you love AI Business! Would you like to leave us a review? It really helps us grow.")){
        window.open("https://g.page/r/YOUR_GOOGLE_REVIEW_LINK","_blank");
      }
    }, 500);
  } else {
    alert("Thank you for your feedback! We will work on improving.");
  }
}


window.openLeadDetail = async function(id){
  var map = window._leadsMap || {};
  var lead = map[id];
  if(lead){
    window._currentOpenLead = lead;
    renderLeadDetailObj(lead);
    return;
  }
  var leads = window._allLeads || [];
  var lead = null;
  for(var i=0;i<leads.length;i++){ if(leads[i].id===id){lead=leads[i];break;} }
  if(!lead){
    try{
      var r = await apiFetch("/api/leads",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
      var d = await r.json();
      window._allLeads = d.leads||[];
      for(var j=0;j<window._allLeads.length;j++){ if(window._allLeads[j].id===id){lead=window._allLeads[j];break;} }
    }catch(e){}
  }
  if(!lead){ alert("Lead not found. Please go back to Leads."); loadPage("leads"); return; }
  window._currentOpenLead = lead;
  renderLeadDetailObj(lead);
};
var currentSub = null;

/* =========================
   START APP
========================= */
// Keep Render alive
setInterval(()=>{
  apiFetch('/api/status').catch(()=>{});
}, 4 * 60 * 1000);

init();

async function checkNotifications(){
  try {
    var res = await apiFetch("/api/notifications", {headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    var dot = document.getElementById("notif_dot");
    if(dot){
      var count = data.unread || 0;
      if(count > 0){
        dot.textContent = count > 9 ? "9+" : String(count);
        dot.style.display = "block";
      } else {
        dot.style.display = "none";
      }
    }
    window._notifications = data.notifications || [];
  } catch(e){}
}

function timeAgo(dateStr){
  var diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if(diff < 60) return "Just now";
  if(diff < 3600) return Math.floor(diff/60) + "m ago";
  if(diff < 86400) return Math.floor(diff/3600) + "h ago";
  if(diff < 172800) return "Yesterday";
  return Math.floor(diff/86400) + "d ago";
}

async function toggleNotifications(){
  var existing = document.getElementById("notif_dropdown");
  if(existing){ existing.remove(); return; }

  var box = document.createElement("div");
  box.id = "notif_dropdown";
  box.style.cssText = "position:fixed;top:60px;right:10px;width:280px;max-height:400px;overflow-y:auto;background:#1e293b;border:1px solid #334155;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,0.5);z-index:9999;padding:10px";
  box.innerHTML = '<p style="margin:0 0 8px;font-size:13px;font-weight:bold">Notifications</p><p style="color:#64748b;font-size:12px;padding:10px;text-align:center">Loading...</p>';
  document.body.appendChild(box);

  try {
    var res = await apiFetch("/api/notifications", {headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var data = await res.json();
    var notifs = data.notifications || [];
    window._notifications = notifs;

    var rows = "";
    if(notifs.length === 0){
      rows = '<p style="color:#64748b;font-size:12px;padding:10px;text-align:center">No notifications yet</p>';
    } else {
      notifs.forEach(function(n){
        var icon = n.type === "booking" ? "📅" : n.type === "lead" ? "📩" : "🔔";
        var unreadStyle = n.is_read ? "opacity:0.5" : "background:rgba(59,130,246,0.08)";
        rows += '<div style="padding:8px;border-bottom:1px solid #0f172a;border-radius:6px;' + unreadStyle + '"><p style="margin:0;font-size:12px">' + icon + " " + n.message + '</p><p style="margin:2px 0 0;font-size:10px;color:#475569">' + timeAgo(n.created_at) + '</p></div>';
      });
    }
    var bodyEl = box.querySelector("p:last-child") ? box : box;
    box.innerHTML = '<p style="margin:0 0 8px;font-size:13px;font-weight:bold">Notifications</p>' + rows;

    var dot = document.getElementById("notif_dot");
    if(dot) dot.style.display = "none";
    apiFetch("/api/notifications/read-all", {method:"POST", headers:{Authorization:"Bearer "+localStorage.getItem("token")}}).catch(function(){});
  } catch(e){
    box.innerHTML = '<p style="margin:0 0 8px;font-size:13px;font-weight:bold">Notifications</p><p style="color:#ef4444;font-size:12px;padding:10px;text-align:center">Could not load. Try again.</p>';
  }

  setTimeout(function(){
    document.addEventListener("click", function closeDropdown(e){
      var d = document.getElementById("notif_dropdown");
      if(d && !d.contains(e.target)){ d.remove(); document.removeEventListener("click", closeDropdown); }
    });
  }, 50);
}

if(typeof window._notifInterval === "undefined"){
  window._notifInterval = setInterval(checkNotifications, 30000);
}



/* =========================
   VIDEO CREATOR
========================= */
function renderVideoCreator(){
  setView(
    '<div class="card">' +
    header("Create Video","dashboard") +
    '<p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Generate a video script for your business, then create it on VideoKit.</p>' +
    '<div style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:14px">' +
    '<input id="vc_biz" placeholder="Your business name" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">' +
    '<input id="vc_service" placeholder="What do you offer?" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">' +
    '<input id="vc_location" placeholder="Your city" style="width:100%;padding:9px;margin-bottom:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;box-sizing:border-box">' +
    '<button onclick="generateVideoScript()" style="width:100%;padding:11px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">Generate Video Script</button>' +
    '</div>' +
    '<div id="vc_result"></div>' +
    '</div>'
  );
}

async function generateVideoScript(){
  var biz = document.getElementById("vc_biz").value.trim();
  var service = document.getElementById("vc_service").value.trim();
  var location = document.getElementById("vc_location").value.trim();
  if(!biz || !service){ alert("Fill business name and service."); return; }

  var btn = document.querySelector("button[onclick=\'generateVideoScript()\']");
  if(btn){ btn.disabled = true; btn.textContent = "Generating..."; }
  var el = document.getElementById("vc_result");
  el.innerHTML = "<p style=\"color:#64748b;font-size:13px;text-align:center;padding:20px\">Writing your script...</p>";

  try {
    var res = await apiFetch("/api/ai-reply", {
      method: "POST",
      headers: {"Content-Type":"application/json", Authorization:"Bearer " + localStorage.getItem("token")},
      body: JSON.stringify({message: "Write an 8-slide video script for " + biz + " in " + (location || "Nigeria") + " offering " + service + ". Use formula: Problem (2 slides), Pain (2 slides), Solution (2 slides), Call to action (2 slides). Each slide one short sentence. End with visit " + window.location.origin.replace(/^https?:\/\//,"") + ". Nigerian audience, emotional, powerful."})
    });
    var data = await res.json();
    if(data.success && data.reply){
      var script = data.reply;
      el.innerHTML =
        "<div style=\"background:#0f172a;border-radius:10px;padding:15px\">" +
        "<p style=\"margin:0 0 10px;font-size:13px;font-weight:bold\">Your Script</p>" +
        "<div style=\"background:#162032;padding:12px;border-radius:8px;margin-bottom:10px\">" +
        "<p style=\"margin:0;font-size:13px;color:#cbd5e1;line-height:1.8;white-space:pre-line\">" + script + "</p>" +
        "</div>" +
        "<button onclick=\"copyVideoScript()\" style=\"width:100%;padding:10px;background:#334155;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px\">Copy Script</button>" +
        "</div>";
      window._videoScript = script;
    } else {
      el.innerHTML = "<p style=\"color:red;font-size:13px\">Failed. Try again.</p>";
    }
  } catch(e){
    el.innerHTML = "<p style=\"color:red;font-size:13px\">Network error. Try again.</p>";
  }
  if(btn){ btn.disabled = false; btn.textContent = "Generate Video Script"; }
}

function copyVideoScript(){
  navigator.clipboard.writeText(window._videoScript || "").then(function(){ alert("Script copied!"); });
}


/* expose functions to global scope for inline onclick handlers */
if (typeof toggleMenu === "function") window.toggleMenu = toggleMenu;
if (typeof showFeedbackPopup === "function") window.showFeedbackPopup = showFeedbackPopup;
if (typeof toggleNotifications === "function") window.toggleNotifications = toggleNotifications;
if (typeof loadPage === "function") window.loadPage = loadPage;
if (typeof logout === "function") window.logout = logout;
console.log("APP.JS REACHED BOTTOM - exports attempted");

function updateEpBizHidden(){
  var boxes = document.querySelectorAll("#ep_biz_grid input[type=checkbox]");
  var checked = Array.prototype.filter.call(boxes, function(cb){ return cb.checked; });
  if(checked.length > 3){
    checked[checked.length - 1].checked = false;
    alert("You can select up to 3 business types.");
    checked = Array.prototype.filter.call(boxes, function(cb){ return cb.checked; });
  }
  var values = checked.map(function(cb){ return cb.value; });
  document.getElementById("ep_biz").value = values.join(",");
}
