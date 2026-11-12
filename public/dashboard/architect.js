/* AI Business - Business Architect brick 1 (owner-sustainability calculator).
   Self-contained: defines renderFeasibility, registers itself in FEATURES (search),
   and wraps window.loadPage so loadPage('feasibility') routes here. No app.js edit.
   Loaded AFTER app.js so FEATURES + loadPage already exist. ASCII only. */
function feasNum(v){var n=parseFloat(String(v==null?'':v).replace(/[^0-9.\-]/g,''));return isFinite(n)?n:0;}
function feasNaira(n){return String.fromCharCode(8358)+Math.round(n).toLocaleString();}
function feasCalc(){
  var cost=feasNum(document.getElementById('fc_cost').value);
  var sell=feasNum(document.getElementById('fc_sell').value);
  var units=feasNum(document.getElementById('fc_units').value);
  var bopex=feasNum(document.getElementById('fc_bopex').value);
  var living=feasNum(document.getElementById('fc_living').value);
  var reserve=feasNum(document.getElementById('fc_reserve').value);
  function band(u){
    var gross=u*(sell-cost);
    var thresh=bopex+living+reserve;
    var gap=gross-thresh;
    var tier;
    if(gross<bopex) tier='Cannot cover the business operating costs yet.';
    else if(gross<bopex+living) tier='Covers business costs, but not your living expenses yet.';
    else if(gross<thresh) tier='Covers business and your minimum living, but not the reserve.';
    else tier='Covers business, your living, and the reserve - sustainable, with reinvestment room.';
    return {u:u,gross:gross,thresh:thresh,gap:gap,tier:tier};
  }
  var base=band(units), cons=band(units*0.5), opt=band(units*1.5);
  try{ localStorage.setItem('ab_feas_last', JSON.stringify({cost:cost,sell:sell,units:units,bopex:bopex,living:living,reserve:reserve})); }catch(e){}
  function row(label,b){
    var col=b.gap>=0?'#10b981':'#f59e0b';
    return '<div style="border:1px solid #1e293b;border-radius:10px;padding:11px 13px;margin-bottom:7px;background:#0f172a">'
      +'<p style="margin:0;font-size:12px;color:#94a3b8">'+label+' - '+b.u.toFixed(0)+' units/mo</p>'
      +'<p style="margin:3px 0 0;font-size:13px;font-weight:700;color:#f8fafc">Throws off '+feasNaira(b.gross)+' - needs '+feasNaira(b.thresh)+'</p>'
      +'<p style="margin:3px 0 0;font-size:12px;color:'+col+'">'+(b.gap>=0?'Surplus '+feasNaira(b.gap):'Short by '+feasNaira(-b.gap))+' - '+b.tier+'</p>'
      +'</div>';
  }
  var belowCost=(sell-cost)<=0;
  var warn=belowCost?'<p style="margin:0 0 10px;font-size:12px;color:#ef4444;font-weight:700">WARNING: You are selling at or below all-in cost. No volume fixes that - fix the price or the cost first.</p>':'';
  document.getElementById('feas_out').innerHTML=
      warn
    + '<p style="margin:0 0 8px;font-size:12px;color:#64748b">Threshold to feed you and the reserve: <b style="color:#3b82f6">'+feasNaira(base.thresh)+'</b> per month in gross throw-off. Below is what each sales scenario actually clears.</p>'
    + row('Conservative (half your forecast)',cons)
    + row('Base (your forecast)',base)
    + row('Optimistic (+50%)',opt)
    + '<p style="margin:12px 0 0;font-size:11px;color:#475569;line-height:1.5">Illustrative - computed from the numbers you entered, not market research. Gross throw-off is potential, NOT guaranteed returns. We never promise immunity from price rises, slow customers, or currency swings.</p>'
    + '<p style="margin:10px 0 6px;font-size:12px;color:#93c5fd;font-weight:700">To raise the throw-off, use what you already have - not a disconnected chatbot:</p>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px">'
    + '<button type="button" onclick="loadPage(\'leadFinder\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Find more buyers</button>'
    + '<button type="button" onclick="loadPage(\'proposal\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Quote them</button>'
    + '<button type="button" onclick="loadPage(\'invoice\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Invoice</button>'
    + '<button type="button" onclick="loadPage(\'revenue\')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer">Record the ACTUAL payment</button>'
    + '</div>'
    + '<p style="margin:8px 0 0;font-size:10px;color:#475569">Safeguard: an invoice does not prove payment, and an agreement does not guarantee delivery. Track the real money and the real hand-over in Revenue.</p>';
}
function renderFeasibility(){
  var p={};try{p=JSON.parse(localStorage.getItem('ab_feas_last')||'{}');}catch(e){}
  function f(id,label,ph){return '<label style="display:block;font-size:11px;color:#64748b;margin:0 0 4px">'+label+'</label><input id="'+id+'" type="number" inputmode="decimal" value="'+(p[id]!=null?p[id]:'')+'" placeholder="'+ph+'" style="display:block;width:100%;box-sizing:border-box;background:#0b1220;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:9px 11px;font-size:13px;margin:0 0 10px">';}
  var hdr=(typeof header==='function')?header('Business Architect - Feasibility','dashboard'):'';
  setView('<div class="card">'+hdr
    +'<p style="font-size:13px;color:#94a3b8;margin:0 0 14px">The first honest question is not what should I sell. It is will this feed me, or eat me alive? Enter your real numbers; the math is deterministic - no AI guessing your market.</p>'
    + f('fc_cost','All-in cost per unit (Naira) - supplier + transport + packaging + delivery','e.g. 120')
    + f('fc_sell','Selling price per unit (Naira)','e.g. 180')
    + f('fc_units','Units you expect to sell per month','e.g. 200')
    + f('fc_bopex','Business operating expenses per month (Naira) - incl. data, calls, other','e.g. 40000')
    + f('fc_living','Your personal living expenses per month (Naira)','e.g. 100000')
    + f('fc_reserve','Monthly reserve / reinvestment target (Naira)','e.g. 20000')
    + '<button type="button" onclick="feasCalc()" style="display:block;width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:14px">Calculate - can it feed me?</button>'
    +'<div id="feas_out"></div></div>');
  if(p.cost||p.sell||p.units){ setTimeout(feasCalc,0); }
}
/* register in search (FEATURES is reachable across classic scripts) */
if (typeof FEATURES!=='undefined' && Array.isArray(FEATURES) && !window.__ARCH_SEARCH) {
  window.__ARCH_SEARCH=1;
  FEATURES.push({label:'Business Architect',icon:'BA',kw:['feasibility','can it feed me','what business','break even','business plan','start a business','profit','architect','is this business worth it','owner salary','will this feed me'],run:function(){loadPage('feasibility');}});
}
/* wrap loadPage once so loadPage('feasibility') routes here; everything else delegates */
if (typeof window.loadPage==='function' && !window.__ARCH_HOOKED) {
  window.__ARCH_HOOKED=1;
  var _origLP=window.loadPage;
  window.loadPage=function(page){
    if(page==='feasibility' && typeof renderFeasibility==='function'){ try{ renderFeasibility(); return; }catch(e){} }
    return _origLP.apply(this, arguments);
  };
}
