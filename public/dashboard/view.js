function showDashboard(){
  document.getElementById("dashboardView").style.display = "block";
  document.getElementById("pageBox").style.display = "none";
}

function showPage(title, content){
  document.getElementById("dashboardView").style.display = "none";

  const box = document.getElementById("pageBox");
  box.style.display = "block";

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3>${title}</h3>
      <span onclick="showDashboard()" style="cursor:pointer">❌</span>
    </div>
    <p style="opacity:0.8;line-height:1.6">${content}</p>
  `;
}
