function showDashboard(){
  document.getElementById("dashboardView").style.display = "block";

  const page = document.getElementById("pageBox");
  if(page) page.style.display = "none";
}

function showPage(title, content){
  document.getElementById("dashboardView").style.display = "none";

  let box = document.getElementById("pageBox");
  if(!box){
    box = document.createElement("div");
    box.id = "pageBox";
    box.className = "card";
    document.body.appendChild(box);
  }

  box.style.display = "block";

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3>${title}</h3>
      <span onclick="showDashboard()" style="cursor:pointer;font-size:18px;">❌</span>
    </div>
    <p style="opacity:0.8;line-height:1.6">${content}</p>
  `;
}
