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
  window.__msTray={el:el,esc:esc,load:load,save:save,capture:capture,apply:apply,renderTray:renderTray,toast:toast};
  injectUI();
})();
(function(){
  var T=window.__msTray; if(!T)return;
  var el=T.el,esc=T.esc,load=T.load,save=T.save,capture=T.capture,apply=T.apply,renderTray=T.renderTray,toast=T.toast;
  var STOP={your:1,own:1,type:1,the:1,and:1,for:1,with:1,business:1,company:1,any:1,all:1,new:1,one:1,per:1,this:1,that:1,from:1,into:1,out:1,about:1,more:1,most:1};
  var SCENE_SYN={lead:['find','buyer','buyers','prospect','prospects','customer','customers','outreach','cold','client','clients'],proposal:['proposal','proposals','quote','pitch','estimate','close'],appointments:['book','booking','bookings','call','calls','schedule','calendar','reserve','slot'],stats:['report','reports','dashboard','analytics','summary','revenue','money','pipeline','progress','track'],social:['social','post','posts','caption','instagram','status','content','advert','promote'],whatsapp:['follow','follow-up','followups','reply','replies','inbox','message','messages','chat','dm','ghost','quiet','chase'],reviews:['review','reviews','testimonial','testimonials','rating','stars','google']};
  var NICHE_ALIAS={realestate:['real estate','property','estate','realtor','letting'],salon:['salon','beauty','hair','braids','nails','barber'],restaurant:['restaurant','food','kitchen','eat','jollof','catering','cafe','bakery'],pharmacy:['pharmacy','chemist','medicine','clinic'],gym:['gym','fitness','workout','training','crossfit'],fashion:['fashion','boutique','clothing','dress','tailor','adire','ankara','agbada'],photography:['photo','photography','studio','shoot','portrait'],mechanical:['mechanic','auto','car','repair','garage','vehicle'],designer:['design','designer','brand','logo','graphic'],developer:['developer','dev','code','coding','web app','landing page','software','programmer']};
  function toks(s){return String(s||'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(function(w){return w.length>1&&!STOP[w];});}
  function flat(list){var o=[];list.forEach(function(x){o=o.concat(x);});return o;}
  function sceneVocab(){var out=[];try{Object.keys(window.SCENES||{}).forEach(function(k){var lab=(window.SCENES[k]&&window.SCENES[k].l)||k;out.push({k:k,l:lab,words:flat([toks(lab),(SCENE_SYN[k]||[]).map(toks)])});});}catch(e){}return out;}
  function nicheVocab(){var out=[];try{Object.keys(window.PRESETS||{}).forEach(function(k){var lab=(window.PRESETS[k]&&window.PRESETS[k].l)||k;out.push({k:k,l:lab,words:flat([toks(lab),(NICHE_ALIAS[k]||[]).map(toks)])});});}catch(e){}return out;}
  function score(tw,vocab){var res=[];vocab.forEach(function(v){var s=0;v.words.forEach(function(w){if(w.length<3){if(tw.indexOf(w)!==-1)s++;}else{for(var i=0;i<tw.length;i++){if(tw[i].indexOf(w)!==-1||w.indexOf(tw[i])!==-1){s++;break;}}}});if(s>0)res.push({k:v.k,l:v.l,s:s});});res.sort(function(a,b){return b.s-a.s;});return res;}
  function pickPanels(){var box=el('ms_posttxt');var text=box?box.value:'';var tw=toks(text);if(!tw.length){toast('Write or paste your post first');return;}var sv=score(tw,sceneVocab());var nv=score(tw,nicheVocab());var niche=nv.length?nv[0].k:null;var scenes=sv.slice(0,4);var host=el('ms_sugg');if(!host)return;if(!scenes.length){host.innerHTML='<p style="font-size:12px;color:#64748b;margin:6px 0 0">No panels matched \u2014 name the features ("find customers", "follow up", "proposal", "bookings").</p>';return;}var h='<p style="margin:8px 0 6px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700">\u2728 Panels for your post'+(niche?(' \u00b7 niche: '+esc((window.PRESETS[niche]&&window.PRESETS[niche].l)||niche)):'')+'</p><div style="display:flex;gap:8px;flex-wrap:wrap">';scenes.forEach(function(sc){h+='<button data-sc="'+esc(sc.k)+'" data-niche="'+esc(niche||'')+'" style="display:flex;align-items:center;gap:6px;background:#1e293b;border:1px solid #334155;color:#f8fafc;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600"><span>\u2933</span>'+esc(sc.l)+'</button>';});h+='</div><p style="margin:6px 0 0;font-size:10px;color:#475569">Tap a panel to pin it, then Bundle. Matching reads the app\u2019s own feature names \u2014 no AI, no canned answers.</p>';host.innerHTML=h;var bs=host.querySelectorAll('[data-sc]');for(var i=0;i<bs.length;i++){(function(b){b.onclick=function(){pinFromMap(b.getAttribute('data-sc'),b.getAttribute('data-niche')||null,b);};})(bs[i]);}}
  function pinFromMap(key,niche,btn){try{if(niche&&el('biz')){el('biz').value=niche;if(typeof window.applyPreset==='function')window.applyPreset();}if(el('scene'))el('scene').value=key;if(el('count'))el('count').value='10';if(typeof window.render==='function')window.render();var arr=load();arr.push(capture());if(arr.length>30)arr=arr.slice(arr.length-30);save(arr);renderTray();btn.innerHTML='<span>\u2713</span> pinned';btn.style.borderColor='#10b981';btn.style.color='#10b981';setTimeout(function(){btn.innerHTML='<span>\u2933</span>'+esc((window.SCENES[key]&&window.SCENES[key].l)||key);btn.style.borderColor='#334155';btn.style.color='#f8fafc';},1400);}catch(e){toast('Pin failed');}}
  function injectMap(){if(el('ms_postbox'))return;var phone=document.querySelector('.phone');if(!phone||!phone.parentNode)return;var d=document.createElement('div');d.id='ms_postbox';d.style.cssText='margin:0 0 14px;background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:12px 14px';d.innerHTML='<label style="font-size:11px;color:#94a3b8;display:block;margin:0 0 6px;font-weight:700">\u270D\uFE0F What are you posting? Paste it and pick the panels.</label><textarea id="ms_posttxt" placeholder="e.g. Stop doing sales by hand. Find the buyers, follow up before they go cold, send the proposal, book the call." style="width:100%;min-height:64px;padding:10px;border-radius:9px;border:1px solid #334155;background:#0b1220;color:#e2e8f0;font-size:13px;line-height:1.5;box-sizing:border-box;resize:vertical;font-family:inherit"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button id="ms_pick" style="flex:1;padding:10px;background:#7c3aed;border:none;color:white;border-radius:9px;cursor:pointer;font-size:13px;font-weight:700">\u2728 Pick panels from my post</button></div><div id="ms_sugg"></div>';phone.parentNode.insertBefore(d,phone);el('ms_pick').onclick=pickPanels;}
  injectMap();
})();
