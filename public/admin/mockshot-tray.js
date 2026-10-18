(function(){
  var KEY='ab_mock_tray', CAP=30;
  function el(id){return document.getElementById(id);}
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fmt(ts){try{return new Date(ts).toLocaleString();}catch(e){return String(ts);}}
  function toast(m){var t=el('ms_toast');if(!t){t=document.createElement('div');t.id='ms_toast';t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#10b981;color:#04221a;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 6px 24px rgba(0,0,0,.4)';document.body.appendChild(t);}t.textContent=m;t.style.opacity='1';clearTimeout(toast._t);toast._t=setTimeout(function(){t.style.opacity='0';},2200);}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){return [];}}
  function save(arr){try{localStorage.setItem(KEY,JSON.stringify(arr));return true;}catch(e){try{arr=arr.slice(Math.max(0,arr.length-CAP));localStorage.setItem(KEY,JSON.stringify(arr));return true;}catch(e2){toast('Tray full \u2014 remove some');return false;}}}
  function capture(){return {ts:Date.now(),biz:(el('biz')||{}).value,scene:(el('scene')||{}).value,count:(el('count')||{}).value,mix:(el('mix')||{}).value,bname:(el('bname')||{}).value,bloc:(el('bloc')||{}).value,bsvc:(el('bsvc')||{}).value,capOn:!!((el('capOn')||{}).checked)};}
  function apply(rec){['biz','scene','count','mix','bname','bloc','bsvc'].forEach(function(id){var e=el(id);if(e&&rec[id]!=null)e.value=rec[id];});var c=el('capOn');if(c)c.checked=!!rec.capOn;if(typeof window.render==='function')window.render();}
  function sceneLabel(rec){try{if(window.SCENES&&window.SCENES[rec.scene])return window.SCENES[rec.scene].l;}catch(e){}return rec.scene||'?';}
  function shotMock(){return window.loadH2C().then(function(){return html2canvas(el('mock'),{backgroundColor:'#0b1220',scale:2});}).then(function(c){return c.toDataURL('image/png');});}
  function dl(u,name){var a=document.createElement('a');a.download=name;a.href=u;a.click();}
  function pinNow(){var arr=load();arr.push(capture());if(arr.length>CAP)arr=arr.slice(arr.length-CAP);if(save(arr)){renderTray();toast('\uD83D\uDCCC Pinned to tray');}}
  function buildPlate(urls){
    var chips=[['\uD83D\uDD0E','Find Customers'],['\uD83D\uDC65','Organize Enquiries'],['\uD83D\uDD51','Follow Up'],['\uD83D\uDCC5','Manage Activities']];
    var head='<div style="display:flex;align-items:center;gap:16px;border-bottom:1px solid #1e293b;padding-bottom:18px">'
      +'<div style="width:54px;height:54px;border-radius:14px;background:#ff7a1a;display:flex;align-items:center;justify-content:center;font-size:28px">\uD83D\uDCCA</div>'
      +'<div style="flex:1"><p style="margin:0;font-size:30px;font-weight:800;color:#f8fafc">AI Business</p>'
      +'<p style="margin:2px 0 0;font-size:13px;color:#94a3b8">Find Customers. Win Them. Never Lose Them.</p></div>'
      +'<div style="font-size:13px;color:#64748b;max-width:240px;line-height:1.5">The all-in-one platform for African entrepreneurs.</div></div>';
    var ch='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">';
    chips.forEach(function(c){ch+='<div style="display:flex;align-items:center;gap:6px;border:1px solid #334155;border-radius:10px;padding:8px 12px;font-size:12px;color:#cbd5e1"><span style="font-size:15px">'+c[0]+'</span>'+c[1]+'</div>';});
    ch+='</div>';
    var cols=urls.length===1?1:(urls.length<=4?2:3);
    var gr='<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:18px;margin-top:18px">';
    urls.forEach(function(u){gr+='<img src="'+u+'" style="width:100%;display:block;border-radius:14px;border:1px solid #1e293b">';});
    gr+='</div>';
    var ft='<div style="text-align:center;margin-top:20px"><span style="display:inline-flex;align-items:center;gap:8px;border:1px solid #334155;border-radius:999px;padding:10px 20px;font-size:14px;color:#cbd5e1">\uD83C\uDF10 ai-business.com.ng</span></div>';
    var p=document.createElement('div');
    p.style.cssText='position:absolute;left:-99999px;top:0;width:1200px;background:#0b1220;padding:28px;box-sizing:border-box;font-family:system-ui,Arial,sans-serif;color:#e2e8f0';
    p.innerHTML=head+ch+gr+ft;
    return p;
  }
  function bundleNow(){
    var arr=load(); var recs=[];
    var boxes=document.querySelectorAll('#tray_box [data-bundle]');
    for(var i=0;i<boxes.length;i++){if(boxes[i].checked){var idx=+boxes[i].getAttribute('data-idx');if(arr[idx])recs.push(arr[idx]);}}
    if(!recs.length){toast('Tick at least one panel');return;}
    var bd=el('ms_bundle'); var old=bd.textContent; bd.disabled=true; bd.textContent='Building\u2026';
    var urls=[]; var chain=Promise.resolve();
    recs.forEach(function(rec){chain=chain.then(function(){apply(rec);return shotMock();}).then(function(u){urls.push(u);});});
    chain.then(function(){
      var plate=buildPlate(urls); document.body.appendChild(plate);
      return window.loadH2C().then(function(){return html2canvas(plate,{backgroundColor:'#0b1220',scale:2});}).then(function(c){
        dl(c.toDataURL('image/png'),'aib-bundle-'+Date.now()+'.png'); plate.remove(); bd.disabled=false; bd.textContent=old; toast('\uD83E\uDDE9 Bundle downloaded');
      }).catch(function(){plate.remove();bd.disabled=false;bd.textContent=old;toast('Bundle failed');});
    }).catch(function(){bd.disabled=false;bd.textContent=old;toast('Bundle failed');});
  }
  function renderTray(){
    var box=el('tray_box'); if(!box)return; var arr=load();
    if(!arr.length){box.innerHTML='<p style="font-size:12px;color:#64748b;margin:0">Tray empty. Generate a panel, then \uD83D\uDCCC Pin it. Pin 2\u201310, tick them, and \uD83E\uDDE9 Bundle into one plate.</p>';return;}
    var h='<p style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700">\uD83D\uDCE6 Tray ('+arr.length+'/'+CAP+') \u2014 tick to bundle \u00b7 \u21BB recall \u00b7 \u2B07 grab one</p>';
    arr.forEach(function(rec,i){
      h+='<div class="ms-row" data-idx="'+i+'" style="display:flex;align-items:center;gap:8px;background:#0f172a;border:1px solid #1e293b;border-radius:9px;padding:8px 10px;margin-bottom:6px">'
        +'<input type="checkbox" data-bundle data-idx="'+i+'" style="width:16px;height:16px;flex-shrink:0">'
        +'<div style="flex:1;min-width:0"><p style="margin:0;font-size:12px;font-weight:700;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(sceneLabel(rec))+' \u00b7 '+esc(rec.bname||'')+'</p>'
        +'<p style="margin:1px 0 0;font-size:10px;color:#64748b">'+esc(fmt(rec.ts))+'</p></div>'
        +'<button data-a="load" style="padding:6px 9px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:7px;cursor:pointer;font-size:12px">\u21BB</button>'
        +'<button data-a="png" style="padding:6px 9px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:7px;cursor:pointer;font-size:12px">\u2B07</button>'
        +'<button data-a="del" style="padding:6px 9px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;border-radius:7px;cursor:pointer;font-size:12px">\u2715</button>'
        +'</div>';
    });
    box.innerHTML=h;
    var rows=box.querySelectorAll('.ms-row');
    for(var r=0;r<rows.length;r++){(function(row){
      var i=+row.getAttribute('data-idx'); var rec=arr[i]; if(!rec)return;
      row.querySelector('[data-a="load"]').onclick=function(){apply(rec);toast('Loaded to studio');};
      row.querySelector('[data-a="png"]').onclick=function(){apply(rec);shotMock().then(function(u){dl(u,'aib-panel-'+rec.ts+'.png');}).catch(function(){toast('PNG failed');});};
      row.querySelector('[data-a="del"]').onclick=function(){var a=load();a.splice(i,1);save(a);renderTray();};
    })(rows[r]);}
  }
  function injectUI(){
    var dlBtn=el('dl'); if(!dlBtn||!dlBtn.parentNode)return;
    if(!el('ms_pin')){var pin=document.createElement('button');pin.id='ms_pin';pin.textContent='\uD83D\uDCCC Pin to tray';pin.style.cssText='padding:10px 14px;background:#0f172a;border:1px solid #334155;color:#cbd5e1;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600';pin.onclick=pinNow;var ref=dlBtn.nextSibling;dlBtn.parentNode.insertBefore(pin,ref);ref=pin.nextSibling;
      if(!el('ms_bundle')){var bd=document.createElement('button');bd.id='ms_bundle';bd.textContent='\uD83E\uDDE9 Bundle selected';bd.style.cssText='padding:10px 14px;background:#7c3aed;border:1px solid #7c3aed;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600';bd.onclick=bundleNow;pin.parentNode.insertBefore(bd,ref);}}
    var phone=document.querySelector('.phone');
    if(phone&&phone.parentNode&&!el('tray_box')){var box=document.createElement('div');box.id='tray_box';box.style.cssText='margin-top:14px';phone.parentNode.insertBefore(box,phone.nextSibling);}
    renderTray();
  }
  injectUI();
})();
