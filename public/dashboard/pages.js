function showPage(title, content){
  const box = document.getElementById("pageBox");
  box.style.display = "block";
  box.innerHTML = `<h3>${title}</h3><p style="opacity:0.85;line-height:1.6">${content}</p>`;
}

/* ABOUT */
function goAbout(){
  showPage("About AI Business",
  "AI Business is a smart automation platform that helps businesses capture leads, respond automatically, and manage customer data efficiently. Built for speed, simplicity, and scalability.");
}

/* POLICY */
function goPolicy(){
  showPage("Policy",
  "We respect user privacy. Data collected is only used to improve service performance, automate lead responses, and enhance user experience. We do not sell personal data.");
}

/* PRIVACY */
function goPrivacy(){
  showPage("Privacy Policy",
  "Your data is stored securely. Authentication is handled via Supabase. We use encryption standards to protect sensitive information and ensure safe access control.");
}

/* SETTINGS */
function goSettings(){
  showPage("Settings",
  "Settings panel is under development. Soon you will be able to manage subscription, profile, notifications, and integrations.");
}
