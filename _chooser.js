async function saveToFile(content, defaultName){
  var files=[];
  try{
    var r=await apiFetch("/api/files",{headers:{Authorization:"Bearer "+localStorage.getItem("token")}});
    var dd=await r.json(); files=(dd&&dd.files)||[];
  }catch(e){}
  var shell='<div id="file_chooser" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;display:flex;align-items:flex-end;justify-content:center">'
    +'<div style="background:#0b1220;border:1px solid #1e293b;border-radius:16px 16px 0 0;width:100%;max-width:520px;max-height:80vh;overflow:auto;padding:18px 16px 24px">'
    +'<p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#f8fafc">Save to a file</p>'
    +'<p style="margin:0 0 14px;font-size:12px;color:#64748b">Pick an existing file to add to, or create a new one.</p>'
    +'<button id="fc_new" style="width:100%;padding:12px;background:#10b981;color:#04221a;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:14px">+ Create new file</button>'
    +'<div id="fc_list"></div>'
    +'<button id="fc_cancel" style="width:100%;margin-top:14px;padding:10px;background:transparent;border:1px solid #334155;color:#94a3b8;border-radius:10px;font-size:12px;cursor:pointer">Cancel</button>'
    +'</div></div>';
  var old=document.getElementById("file_chooser"); if(old) old.remove();
  var wrap=document.createElement("div"); wrap.innerHTML=shell; var modal=wrap.firstElementChild; document.body.appendChild(modal);
  function close(){ var m=document.getElementById("file_chooser"); if(m) m.remove(); }
  modal.addEventListener("click",function(ev){ if(ev.target===modal) close(); });
  document.getElementById("fc_cancel").onclick=close;
  document.getElementById("fc_new").onclick=function(){ close(); createNewFile(content, defaultName); };
  var listEl=document.getElementById("fc_list");
  if(!files.length){ listEl.innerHTML='<p style="font-size:12px;color:#64748b;text-align:center;padding:10px 0">No files yet - create your first one above.</p>'; }
  else{
    var head=document.createElement("p"); head.textContent="Or add to an existing file";
    head.style.cssText="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700";
    listEl.appendChild(head);
    files.forEach(function(f){
      var snip=(f.content||"").replace(/\s+/g," ").trim().slice(0,60);
      var row=document.createElement("div");
      row.style.cssText="display:flex;align-items:center;gap:10px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:11px 13px;margin-bottom:8px;cursor:pointer";
      var left=document.createElement("div"); left.style.cssText="flex:1;min-width:0";
      var nm=document.createElement("p"); nm.textContent=f.name; nm.style.cssText="margin:0;font-size:13px;font-weight:700;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
      var sp=document.createElement("p"); sp.textContent=snip||"empty file"; sp.style.cssText="margin:2px 0 0;font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
      left.appendChild(nm); left.appendChild(sp);
      var tag=document.createElement("span"); tag.textContent="+ Add"; tag.style.cssText="flex-shrink:0;font-size:11px;font-weight:700;color:#10b981";
      row.appendChild(left); row.appendChild(tag);
      row.onclick=function(){ close(); appendToFile(f.id, f.name, (f.content||""), content); };
      listEl.appendChild(row);
    });
  }
}
async function createNewFile(content, defaultName){
  var name=window.prompt("Name your new file:", defaultName||"Untitled");
  if(name===null) return; name=String(name).trim(); if(!name){ fileToast("Needs a name"); return; }
  try{
    var res=await apiFetch("/api/files",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({name:name,content:content||""})});
    var d=await res.json();
    if(d.success){ fileToast("Created \""+name+"\""); } else { fileToast("Save failed: "+(d.error||"server rejected")); }
  }catch(e){ console.error("createNewFile failed:",e); fileToast("Save failed: "+((e&&e.message)||"network/endpoint")); }
}
async function appendToFile(id, name, base, content){
  try{
    var stamp=new Date().toLocaleString();
    var line="----------------------------------------";
    var sep=base? (base+"\n\n"+line+"\n["+stamp+"]\n") : ("["+stamp+"]\n");
    var merged=sep+(content||"");
    var res=await apiFetch("/api/files/"+id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("token")},body:JSON.stringify({content:merged})});
    var d=await res.json();
    if(d.success){ fileToast("Added to \""+name+"\""); } else { fileToast("Add failed: "+(d.error||"server rejected")); }
  }catch(e){ console.error("appendToFile failed:",e); fileToast("Add failed: "+((e&&e.message)||"network/endpoint")); }
}
