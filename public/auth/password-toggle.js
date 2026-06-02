
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);

  if (!input || !icon) return;

  if (input.type === "password") {
    input.type = "text";
    icon.innerText = "🙈"; // closed eye
  } else {
    input.type = "password";
    icon.innerText = "👁️"; // open eye
  }
}

window.togglePassword = togglePassword;

