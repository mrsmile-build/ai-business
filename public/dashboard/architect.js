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
  setView('<div class="card">'+hdr
   +'<p style="font-size:13px;color:#94a3b8;margin:0 0 14px">From your current situation to a real, growing business. Tell us where you are; the system investigates, calculates and plans with you - never inventing numbers.</p>'
   +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
   +'<button type="button" onclick="loadPage(\'feasibility\')" style="flex:1;min-width:150px;background:#132a4a;border:1px solid #2563eb;color:#dbeafe;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer">I have an idea - test if it can feed me</button>'
   +'<button type="button" disabled style="flex:1;min-width:150px;background:#0f172a;border:1px solid #1e293b;color:#475569;border-radius:10px;padding:12px;font-size:13px;cursor:not-allowed">I have no idea yet - Discovery (stage 2, needs research sources)</button>'
   +'</div>'
   +'<p style="font-size:12px;color:#93c5fd;font-weight:700;margin:0 0 8px">Your business profile (saved on this device)</p>'
   + f('bp_capital','Available starting capital (in your currency)','e.g. 50000',p.capital)
   + f('bp_location','Country, state and town','e.g. Nigeria, Lagos, Ikeja',p.location)
   + f('bp_skills','Skills and experience','e.g. tailoring, sales, coding',p.skills)
   + f('bp_hours','Hours available per day','e.g. 4',p.hours)
   + f('bp_living','Personal living expenses per month','e.g. 100000',p.living)
   + f('bp_storage','Can you store inventory? (yes/no)','yes or no',p.storage)
   + f('bp_income','Do you need income immediately? (yes/no)','yes or no',p.income_now)
   + f('bp_ambition','Long-term ambition','e.g. own a production company',p.ambition)
   +'<button type="button" onclick="archSaveProfile()" style="display:block;width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer">Save my profile</button>'
   +'<p id="bp_msg" style="margin:8px 0 0;font-size:12px;color:#10b981"></p>'
   +'</div>');
}
if (typeof window.loadPage==='function') {
  var _lp2=window.loadPage;
  window.loadPage=function(page){
    if(page==='architect' && typeof renderArchitect==='function'){ try{ renderArchitect(); return; }catch(e){} }
    return _lp2.apply(this, arguments);
  };
}
