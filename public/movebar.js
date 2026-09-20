(function(){
  var h = location.hostname;
  if (h.indexOf("onrender.com") === -1 && h.indexOf("vercel.app") === -1) return;
  var target = "https://www.ai-business.com.ng" + location.pathname + location.search;
  var n = 10;
  function attach(){
    if (document.getElementById("movebar")) return;
    var bar = document.createElement("div");
    bar.id = "movebar";
    bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483000;background:#052e16;color:#d1fae5;padding:10px 12px;font:13px/1.5 system-ui,-apple-system,sans-serif;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.5)";
    bar.innerHTML = '📢 AI Business has a new permanent home! Visit <a href="'+target+'" style="color:#7dd3fc;font-weight:700">www.ai-business.com.ng</a> — taking you there in <b id="movebar_n">10</b>s…';
    document.body.prepend(bar);
    document.body.style.paddingTop = "48px";
  }
  if (document.body) attach(); else document.addEventListener("DOMContentLoaded", attach);
  var t = setInterval(function(){ n--; var e = document.getElementById("movebar_n"); if (e) e.textContent = n; if (n <= 0) { clearInterval(t); location.replace(target); } }, 1000);
})();
