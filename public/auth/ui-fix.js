
/* ---------------- LOADING UTILITY ---------------- */
function setLoading(btn, state, text="Processing...") {
  if (!btn) return;

  if (state) {
    btn.dataset.original = btn.innerText;
    btn.innerText = text;
    btn.disabled = true;
    btn.style.opacity = "0.7";
  } else {
    btn.innerText = btn.dataset.original || btn.innerText;
    btn.disabled = false;
    btn.style.opacity = "1";
  }
}

window.setLoading = setLoading;

