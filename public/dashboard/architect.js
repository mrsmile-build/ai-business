/* Business Architect brick 1.5 - currency-aware + deterministic feasibility report.
   Builds on brick 1 (same inputs, same tiers). No app.js edit. ASCII only. */
function feasCur(){ try{ return (window.userCurrency||'NGN'); }catch(e){ return 'NGN'; } }
function feasNum(v){var n=parseFloat(String(v==null?'':v).replace(/[^0-9.\-]/g,''));return isFinite(n)?n:0;}
function feasMoney(n){return feasCur()+' '+Math.round(n).toLocaleString();}
function feasCalc(){
  var cost=feasNum(document.getElementById('fc_cost').value);
  var sell=feasNum(document.getElementById('fc_sell').value);
  var units=feasNum(document.getElementById('fc_units').value);
  var bopex=feasNum(document.getElementById('fc_bopex').value);
  var living=feasNum(document.getElementById('fc_living').value);
  var reserve=feasNum(document.getElementById('fc_reserve').value);
  var margin=sell-cost, revenue=units*sell, gross=units*margin, op=gross-bopex;
  var need=bopex+living+reserve;
  var beUnits=margin>0?Math.ceil(bopex/margin):null;
  var needUnits=margin>0?Math.ceil(need/margin):null;
  function band(u){
    var g=u*margin, gap=g-need, tier;
    if(g<bopex) tier='Cannot cover the business operating costs yet.';
    else if(g<bopex+living) tier='Covers business costs, but not your living expenses yet.';
    else if(g<need) tier='Covers business and your minimum living, but not the reserve.';
    else tier='Covers business, your living, and the reserve - sustainable, with reinvestment room.';
    return {u:u,gross:g,thresh:need,gap:gap,tier:tier};
  }
  var base=band(units), cons=band(units*0.5), opt=band(units*1.5);
  try{ localStorage.setItem('ab_feas_last', JSON.stringify({cost:cost,sell:sell,units:units,bopex:bopex,living:living,reserve:reserve,cur:feasCur()})); }catch(e){}
  function line(label,val){return '<p style="margin:0 0 6px;font-size:13px;color:#e2e8f0"><span style="color:#94a3b8">'+label+':</span> <b>'+val+'</b></p>';}
  function row(label,b){
    var col=b.gap>=0?'#10b981':'#f59e0b';
    return '<div style="border:1px solid #1e293b;border-radius:10px;padding:11px 13px;margin-bottom:7px;background:#0f172a">'
      +'<p style="margin:0;font-size:12px;color:#94a3b8">'+label+' - '+b.u.toFixed(0)+' units/mo</p>'
      +'<p style="margin:3px 0 0;font-size:13px;font-weight:700;color:#f8fafc">Throws off '+feasMoney(b.gross)+' - needs '+feasMoney(b.thresh)+'</p>'
      +'<p style="margin:3px 0 0;font-size:12px;color:'+col+'">'+(b.gap>=0?'Surplus '+feasMoney(b.gap):'Short by '+feasMoney(-b.gap))+' - '+b.tier+'</p></div>';
  }
  var warn=(margin<=0)?'<p style="margin:0 0 10px;font-size:12px;color:#ef4444;font-weight:700">WARNING: selling at or below all-in cost. No volume fixes that - fix price or cost first.</p>':'';
  document.getElementById('feas_out').innerHTML=
      warn
    + '<div style="border:1px solid #1e293b;border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#0f172a">'
    + '<p style="margin:0 0 8px;font-size:12px;color:#93c5fd;font-weight:700">Feasibility report ('+feasCur()+') - illustrative, from your numbers</p>'
    + line('Monthly revenue',feasMoney(revenue))
    + line('Gross profit (after product cost)',feasMoney(gross))
    + line('Operating profit (after business expenses)',feasMoney(op))
    + line('Break-even units (cover business costs)',beUnits==null?'n/a - no margin':beUnits.toLocaleString()+' units/mo')
    + line('Units to also cover living + reserve',needUnits==null?'n/a - no margin':needUnits.toLocaleString()+' units/mo')
    + '</div>'
    + '<p style="margin:0 0 8px;font-size:12px;color:#64748b">Threshold to feed you and the reserve: <b style="color:#3b82f6">'+feasMoney(need)+'</b>/month. Your expected volume is an ASSUMPTION, not a guarantee:</p>'
    + row('Conservative (half your forecast)',cons)
    + row('Base (your forecast)',base)
    + row('Optimistic (+50%)',opt)
    + '<p style="margin:12px 0 0;font-size:11px;color:#475569;line-height:1.5">Computed deterministically from your inputs, not market research. Profit is not cash: unpaid invoices and unsold stock are not counted here. We never promise immunity from price rises, slow customers, or currency swings.</p>'
    + '<p style="margin:10px 0 6px;font-size:12px;color:#93c5fd;font-weight:700">To raise the throw-off, use what you already have:</p>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px">'
    + '<button type="button" onclick="loadPage(\'leadFinder\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Find more buyers</button>'
    + '<button type="button" onclick="loadPage(\'proposal\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Quote them</button>'
    + '<button type="button" onclick="loadPage(\'invoice\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Invoice</button>'
    + '<button type="button" onclick="loadPage(\'revenue\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Record the ACTUAL payment</button>'
    + '</div>'
    + '<p style="margin:8px 0 0;font-size:10px;color:#475569">Safeguard: an invoice does not prove payment; an agreement does not guarantee delivery. Track real money and real hand-over in Revenue.</p>';
}
function renderFeasibility(){
  var p={};try{p=JSON.parse(localStorage.getItem('ab_feas_last')||'{}');}catch(e){}
  var _prof={};try{_prof=JSON.parse(localStorage.getItem('ab_biz_profile')||'{}');}catch(e){}
  if(!p.living&&_prof.living){p.living=_prof.living;}
  var c=feasCur();
  function f(id,label,ph){return '<label style="display:block;font-size:11px;color:#64748b;margin:0 0 4px">'+label+'</label><input id="'+id+'" type="number" inputmode="decimal" value="'+(p[id]!=null?p[id]:'')+'" placeholder="'+ph+'" style="display:block;width:100%;box-sizing:border-box;background:#0b1220;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:9px 11px;font-size:13px;margin:0 0 10px">';}
  var hdr=(typeof header==='function')?header('Business Architect - Feasibility','dashboard'):'';
  setView('<div class="card">'+hdr
    +'<p style="font-size:13px;color:#94a3b8;margin:0 0 14px">The first honest question is not what should I sell. It is will this feed me, or eat me alive? Enter your real numbers in '+c+'; the math is deterministic - no AI guessing your market.</p>'
    + f('fc_cost','All-in cost per unit ('+c+') - supplier + transport + packaging + delivery','e.g. 120')
    + f('fc_sell','Selling price per unit ('+c+')','e.g. 180')
    + f('fc_units','Units you expect to sell per month (assumption)','e.g. 200')
    + f('fc_bopex','Business operating expenses per month ('+c+') - incl. data, calls, other','e.g. 40000')
    + f('fc_living','Your personal living expenses per month ('+c+')','e.g. 100000')
    + f('fc_reserve','Monthly reserve / reinvestment target ('+c+')','e.g. 20000')
    + '<button type="button" onclick="feasCalc()" style="display:block;width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:14px">Calculate - can it feed me?</button>'
    +'<div id="feas_out"></div></div>');
  if(p.cost||p.sell||p.units){ setTimeout(feasCalc,0); }
}
if (typeof window.loadPage==='function' && !window.__ARCH_HOOKED) {
  window.__ARCH_HOOKED=1;
  var _origLP=window.loadPage;
  window.loadPage=function(page){
    if(page==='feasibility' && typeof renderFeasibility==='function'){ try{ renderFeasibility(); return; }catch(e){} }
    return _origLP.apply(this, arguments);
  };
}



function archProfile(){ try{ return JSON.parse(localStorage.getItem('ab_biz_profile')||'{}'); }catch(e){ return {}; } }
function archSaveProfile(){
  var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var p={capital:g('bp_capital'),location:g('bp_location'),skills:g('bp_skills'),hours:g('bp_hours'),living:g('bp_living'),storage:g('bp_storage'),income_now:g('bp_income'),ambition:g('bp_ambition')};
  try{ localStorage.setItem('ab_biz_profile',JSON.stringify(p)); }catch(e){}
  var msg=document.getElementById('bp_msg'); if(msg){ msg.textContent='Profile saved. Feasibility will use your living costs automatically.'; }
}
function renderArchitect(){
  var p=archProfile();
  function f(id,label,ph,val){return '<label style="display:block;font-size:11px;color:#64748b;margin:0 0 4px">'+label+'</label><input id="'+id+'" value="'+(val||'')+'" placeholder="'+ph+'" style="display:block;width:100%;box-sizing:border-box;background:#0b1220;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:9px 11px;font-size:13px;margin:0 0 10px">';}
  var hdr=(typeof header==='function')?header('Business Architect','dashboard'):'';
  setView(
  '<div class="card">' +
  hdr +
  '<p style="font-size:13px;color:#94a3b8;margin:0 0 14px">From your current situation to a real, growing business. Three live rooms now. The rest open only when there is real evidence to stand on.</p>' +
  '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">' +
  '<button type="button" onclick="archGoFeas()" style="flex:1;min-width:140px;background:#132a4a;border:1px solid #2563eb;color:#dbeafe;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer">I have an idea - test if it can feed me</button>' +
  '<button type="button" onclick="archGoDisc()" style="flex:1;min-width:140px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer">I have no idea - ask the planner</button>' +
  '<button type="button" onclick="archGoGuide()" style="flex:1;min-width:140px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:10px;padding:12px;font-size:13px;cursor:pointer">New here? Learn the basics</button>' +
  '</div>' +
  '<p style="font-size:12px;color:#93c5fd;font-weight:700;margin:0 0 8px">Your business profile (saved on this device)</p>' +
  f('bp_capital','Available starting capital (in your currency)','e.g. 50000',p.capital) +
  f('bp_location','Country, state and town','e.g. Nigeria, Lagos, Ikeja',p.location) +
  f('bp_skills','Skills and experience','e.g. tailoring, sales, coding',p.skills) +
  f('bp_hours','Hours available per day','e.g. 4',p.hours) +
  f('bp_living','Personal living expenses per month','e.g. 100000',p.living) +
  f('bp_storage','Can you store inventory? (yes/no)','yes or no',p.storage) +
  f('bp_income','Do you need income immediately? (yes/no)','yes or no',p.income_now) +
  f('bp_ambition','Long-term ambition','e.g. own a production company',p.ambition) +
  '<button type="button" onclick="archSaveProfile()" style="display:block;width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer">Save my profile</button>' +
  '<p id="bp_msg" style="margin:8px 0 0;font-size:12px;color:#10b981"></p>' +
  '<p style="margin:14px 0 0;font-size:11px;color:#475569">Planner ideas are AI hypotheses, not confirmed prices or demand. Research, roadmap and mentor open later, built on real evidence - never invented numbers. HasData is reserved for Lead Finder, not spent on browsing.</p>' +
  '</div>'
  );
}
if (typeof window.loadPage==='function') {
  var _lp2=window.loadPage;
  window.loadPage=function(page){
    if(page==='architect' && typeof renderArchitect==='function'){ try{ renderArchitect(); return; }catch(e){} }
    return _lp2.apply(this, arguments);
  };
}

function archDiscoveryNote(){
  var hdr=(typeof header==='function')?header('Business Discovery - stage 2','dashboard'):'';
  setView('<div class="card">'+hdr
   +'<p style="font-size:13px;color:#94a3b8;margin:0 0 12px">Discovery - finding you a business when you have no idea yet - is stage 2, and it is deliberately not live. It needs real research sources (supplier prices, demand, competitors). We will not invent those numbers for you, so it stays closed until the research layer exists.</p>'
   +'<p style="font-size:13px;color:#94a3b8;margin:0 0 12px">Meanwhile, the honest way to explore your market today is Lead Finder: search your town plus a product or service, and study who already sells it, their ratings and whether they have a website. That is real evidence, not a guess.</p>'
   +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
   +'<button type="button" onclick="loadPage(\'leadFinder\')" style="background:#132a4a;border:1px solid #2563eb;color:#dbeafe;border-radius:10px;padding:11px 14px;font-size:13px;font-weight:700;cursor:pointer">Open Lead Finder</button>'
   +'<button type="button" onclick="loadPage(\'architect\')" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:10px;padding:11px 14px;font-size:13px;cursor:pointer">Back to Architect</button>'
   +'</div></div>');
}


if(typeof window.esc!=='function'){
  window.esc=function(s){
    return String(s==null?'':s).replace(/[&<>"]/g,function(c){
      return c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':'&quot;';
    });
  };
}

window.archDiscoveryNote=async function(){
  var prof={};try{prof=JSON.parse(localStorage.getItem('ab_biz_profile')||'{}');}catch(e){}
  var _locFull=String(prof.location||'').replace(/"/g,'');
  var _cty=(String(prof.location||'').split(',')[0]||'').trim();
  var hdr=(typeof header==='function')?header('Business Discovery','dashboard'):'';
  var inp='style="display:block;width:100%;box-sizing:border-box;background:#0b1220;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 10px;font-size:13px;margin-top:4px"';
  var form='<div class="card">'+hdr
    +'<p style="font-size:12px;color:#93c5fd;margin:0 0 12px">These are AI hypotheses from your profile - NOT confirmed market prices or demand. In '+(_cty||'your country')+' costs move with the economy, so any figure can be far off today. Validate every one by contacting real suppliers and buyers before you spend. Set your country below so the planner uses YOUR market, never an assumed one.</p>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 12px">'
    +'<label style="font-size:11px;color:#64748b;display:block">How many ideas<input id="disc_count" type="number" min="3" max="20" value="5" '+inp+'></label>'
    +'<label style="font-size:11px;color:#64748b;display:block;flex:1;min-width:160px">What kind (the planner favors THIS)<input id="disc_focus" type="text" value="" placeholder="e.g. production, manufacturing, farming, service, brokerage" '+inp+'></label>'
    +'</div>'
    +'<label style="font-size:11px;color:#64748b;display:block;margin:0 0 12px">Country, state and city (overrides your saved profile)<input id="disc_loc" type="text" value="'+_locFull+'" placeholder="e.g. Ghana, Accra" '+inp+'></label>'
    +'<label style="font-size:12px;color:#94a3b8;display:flex;align-items:center;gap:8px;margin:0 0 14px"><input id="disc_resil" type="checkbox" checked style="width:auto"> Prefer durable businesses (essential demand, local, asset-backed, recurring) - a tendency, not a guarantee</label>'
    +'<button type="button" onclick="archRunDiscovery()" style="display:block;width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">Get my ideas</button>'
    +'<p id="disc_status" style="font-size:12px;color:#64748b;margin:12px 0 0"></p>'
    +'<div id="disc_out" style="margin-top:12px"></div>'
    +'</div>';
  setView(form);
};
window.archRunDiscovery=async function(){
  var BE=(typeof API_BACKENDS!=='undefined'&&API_BACKENDS[0])||'https://ai-business-1-ok3x.onrender.com';
  var prof={};try{prof=JSON.parse(localStorage.getItem('ab_biz_profile')||'{}');}catch(e){}
  var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var cnt=parseInt(g('disc_count'),10)||5; if(cnt<3)cnt=3; if(cnt>20)cnt=20;
  var foc=g('disc_focus');
  var locIn=g('disc_loc'); var useLoc=locIn||prof.location||'';
  var rb=document.getElementById('disc_resil'); var res=rb?rb.checked:true;
  var st=document.getElementById('disc_status'); if(st){ st.style.display=''; st.textContent='Thinking through your profile, your country, the kind you asked for, your capital band, and durability...'; }
  var out=document.getElementById('disc_out'); if(out) out.innerHTML='';
  try{
    var ac=new AbortController(); var to=setTimeout(function(){ac.abort();},30000);
    var body={capital:prof.capital,location:useLoc,skills:prof.skills,hours:prof.hours,living:prof.living,storage:prof.storage,income_now:prof.income_now,ambition:prof.ambition,count:cnt,focus:foc,resilience:res};
    var r;
    try{ r=await fetch(BE+'/api/biz-ideas',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify(body),signal:ac.signal}); }finally{ clearTimeout(to); }
    if(st) st.style.display='none';
    var ct=(r.headers.get('content-type')||'');
    if(ct.indexOf('application/json')===-1){ if(out) out.innerHTML='<p style="color:#f59e0b;font-size:13px">The server returned a non-JSON reply (likely still waking up). Tap Get my ideas again in a moment.</p>'; return; }
    var data=await r.json();
    if(!data||!data.success){ if(out) out.innerHTML='<p style="color:#ef4444;font-size:13px">'+esc((data&&data.error)||'The planning assistant returned nothing.')+'</p>'; return; }
    if(out) out.innerHTML='<div style="white-space:pre-wrap;font-size:13px;color:#e2e8f0;line-height:1.6">'+esc(String(data.ideas||''))+'</div>'
      +'<p style="margin:14px 0 6px;font-size:12px;color:#94a3b8">Next real step: open Lead Finder, search your town plus the product, get REAL listings (these businesses exist), then call them to confirm prices. That turns a hypothesis into a fact. The ratings are relative fit and durability, not guarantees.</p>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button type="button" onclick="loadPage(\'leadFinder\')" style="background:#132a4a;border:1px solid #2563eb;color:#dbeafe;border-radius:10px;padding:11px 14px;font-size:13px;font-weight:700;cursor:pointer">Open Lead Finder</button>'
      +'<button type="button" onclick="archDiscoveryNote()" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:10px;padding:11px 14px;font-size:13px;cursor:pointer">Adjust and ask again</button>'
      +'</div>';
  }catch(e){
    if(st) st.style.display='none';
    if(out) out.innerHTML='<p style="color:#ef4444;font-size:13px">Could not reach the planning assistant: '+esc((e&&e.message)||'unknown')+'</p>';
  }
};
window.archRunDiscovery=async function(){
  var BE=(typeof API_BACKENDS!=='undefined'&&API_BACKENDS[0])||'https://ai-business-1-ok3x.onrender.com';
  var prof={};try{prof=JSON.parse(localStorage.getItem('ab_biz_profile')||'{}');}catch(e){}
  var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var cnt=parseInt(g('disc_count'),10)||5; if(cnt<3)cnt=3; if(cnt>20)cnt=20;
  var foc=g('disc_focus');
  var rb=document.getElementById('disc_resil'); var res=rb?rb.checked:true;
  var st=document.getElementById('disc_status'); if(st){ st.style.display=''; st.textContent='Thinking through your profile, capital band, the kind you asked for, and durability...'; }
  var out=document.getElementById('disc_out'); if(out) out.innerHTML='';
  try{
    var ac=new AbortController(); var to=setTimeout(function(){ac.abort();},30000);
    var body={capital:prof.capital,location:prof.location,skills:prof.skills,hours:prof.hours,living:prof.living,storage:prof.storage,income_now:prof.income_now,ambition:prof.ambition,count:cnt,focus:foc,resilience:res};
    var r;
    try{ r=await fetch(BE+'/api/biz-ideas',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify(body),signal:ac.signal}); }finally{ clearTimeout(to); }
    if(st) st.style.display='none';
    var ct=(r.headers.get('content-type')||'');
    if(ct.indexOf('application/json')===-1){ if(out) out.innerHTML='<p style="color:#f59e0b;font-size:13px">The server returned a non-JSON reply (likely still waking up). Tap Get my ideas again in a moment.</p>'; return; }
    var data=await r.json();
    if(!data||!data.success){ if(out) out.innerHTML='<p style="color:#ef4444;font-size:13px">'+esc((data&&data.error)||'The planning assistant returned nothing.')+'</p>'; return; }
    if(out) out.innerHTML='<div style="white-space:pre-wrap;font-size:13px;color:#e2e8f0;line-height:1.6">'+esc(String(data.ideas||''))+'</div>'
      +'<p style="margin:14px 0 6px;font-size:12px;color:#94a3b8">Next real step: open Lead Finder, search your town plus the product, get REAL listings (these businesses exist), then call them to confirm prices. That turns a hypothesis into a fact. The ratings are relative fit and durability, not guarantees.</p>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button type="button" onclick="loadPage(\'leadFinder\')" style="background:#132a4a;border:1px solid #2563eb;color:#dbeafe;border-radius:10px;padding:11px 14px;font-size:13px;font-weight:700;cursor:pointer">Open Lead Finder</button>'
      +'<button type="button" onclick="archDiscoveryNote()" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:10px;padding:11px 14px;font-size:13px;cursor:pointer">Adjust and ask again</button>'
      +'</div>';
  }catch(e){
    if(st) st.style.display='none';
    if(out) out.innerHTML='<p style="color:#ef4444;font-size:13px">Could not reach the planning assistant: '+esc((e&&e.message)||'unknown')+'</p>';
  }
};

function renderArchGuide(){
  var hdr=(typeof header==='function')?header('Business Architect - beginner guide','dashboard'):'';
  function card(t,b){return '<div style="border:1px solid #1e293b;border-radius:10px;padding:12px 14px;margin-bottom:8px;background:#0f172a"><p style="margin:0;font-size:13px;font-weight:700;color:#f8fafc">'+t+'</p><p style="margin:4px 0 0;font-size:12px;color:#94a3b8;line-height:1.5">'+b+'</p></div>';}
  setView('<div class="card">'+hdr
   +'<p style="font-size:13px;color:#94a3b8;margin:0 0 14px">Plain meaning of the numbers, so no tool can bluff you. This is education, not market data.</p>'
   + card('Gross profit','Selling price minus the all-in cost of one unit (supplier + transport + packaging + delivery). If this is zero or negative, no volume saves you - fix price or cost first.')
   + card('Operating profit','Gross profit minus monthly business expenses (data, calls, tools). This is what the business keeps before it pays you.')
   + card('Break-even units','The number you must sell so gross profit covers business expenses. Below it, the business eats your savings.')
   + card('Profit is not cash','An invoice is not a payment; an agreement is not a delivery. Track real money in Revenue and real hand-over, or the math lies by omission.')
   + card('Volume is an assumption','Your expected units is an assumption, not a guarantee. The report shows conservative, base and optimistic so you see the swing before you commit money.')
   + card('How to validate a planner idea','Treat it as a hypothesis. Open Lead Finder, search your town plus the product, get real listings (that proves the business exists), then call them to confirm price and demand. A June price is not a December price in Nigeria - the economy moves. Confirm before you spend.')
   + card('Three evidence labels','VERIFIED = you saw it (a real quote, a real listing). ESTIMATED = a public source hinted it, with date and origin. UNKNOWN = not confirmed - do not build on it.')
   +'<button type="button" onclick="archGoHome()" style="margin-top:6px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:10px;padding:11px 14px;font-size:13px;cursor:pointer">Back to Architect</button>'
   +'</div>');
}
function archGoFeas(){ loadPage('feasibility'); }
function archGoDisc(){ archDiscoveryNote(); }
function archGoGuide(){ renderArchGuide(); }
function archGoHome(){ loadPage('architect'); }
