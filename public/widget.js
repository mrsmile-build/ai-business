(function(){
  var userId = document.currentScript.getAttribute("data-user");
  var apiBase = document.currentScript.src.replace("/widget.js","");
  if(!userId) return;

  var style = document.createElement("style");
  style.textContent = `
    #aib-widget-btn{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:white;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(59,130,246,0.4);z-index:9999;transition:transform 0.2s}
    #aib-widget-btn:hover{transform:scale(1.1)}
    #aib-widget-box{position:fixed;bottom:86px;right:20px;width:300px;background:#0f172a;border:1px solid #334155;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);z-index:9999;display:none;flex-direction:column;overflow:hidden}
    #aib-widget-header{background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:14px 16px;color:white}
    #aib-widget-messages{height:220px;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
    #aib-widget-input-row{padding:10px;border-top:1px solid #1e293b;display:flex;gap:8px}
    #aib-widget-input{flex:1;padding:8px 10px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:white;font-size:13px;outline:none}
    #aib-widget-send{padding:8px 14px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px}
    .aib-msg-user{background:#1e293b;padding:8px 12px;border-radius:12px 12px 4px 12px;font-size:12px;color:#cbd5e1;align-self:flex-end;max-width:80%}
    .aib-msg-bot{background:#162032;padding:8px 12px;border-radius:12px 12px 12px 4px;font-size:12px;color:#94a3b8;align-self:flex-start;max-width:80%;border-left:2px solid #3b82f6}
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML("beforeend", `
    <button id="aib-widget-btn">💬</button>
    <div id="aib-widget-box">
      <div id="aib-widget-header">
        <p style="margin:0;font-weight:bold;font-size:14px">AI Receptionist</p>
        <p style="margin:2px 0 0;font-size:11px;opacity:0.7">How can we help you?</p>
      </div>
      <div id="aib-widget-messages">
        <div class="aib-msg-bot">Hi! Welcome. How can I help you today?</div>
      </div>
      <div id="aib-widget-input-row">
        <input id="aib-widget-input" placeholder="Type your question..." onkeypress="if(event.key==='Enter')document.getElementById('aib-widget-send').click()">
        <button id="aib-widget-send">Send</button>
      </div>
    </div>
  `);

  document.getElementById("aib-widget-btn").onclick = function(){
    var box = document.getElementById("aib-widget-box");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
    box.style.flexDirection = "column";
  };

  document.getElementById("aib-widget-send").onclick = async function(){
    var input = document.getElementById("aib-widget-input");
    var msg = input.value.trim();
    if(!msg) return;
    var msgs = document.getElementById("aib-widget-messages");
    msgs.insertAdjacentHTML("beforeend", `<div class="aib-msg-user">${msg}</div>`);
    msgs.insertAdjacentHTML("beforeend", `<div class="aib-msg-bot" id="aib-typing">Typing...</div>`);
    msgs.scrollTop = msgs.scrollHeight;
    input.value = "";
    try {
      var res = await fetch(apiBase+"/api/widget/chat",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({user_id:userId, question:msg})
      });
      var data = await res.json();
      var typing = document.getElementById("aib-typing");
      if(typing){ typing.textContent = data.reply || "Thank you! We will get back to you soon."; typing.removeAttribute("id"); }
    } catch(e){
      var typing = document.getElementById("aib-typing");
      if(typing){ typing.textContent = "Thank you! We will respond shortly."; typing.removeAttribute("id"); }
    }
    msgs.scrollTop = msgs.scrollHeight;
  };
})();