import { supabase } from "./supabase.js";

/* CLEAN ERROR MAPPER */
function cleanError(message) {
  if (!message) return "Something went wrong";

  const msg = message.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Wrong email or password";
  }

  if (msg.includes("user already registered")) {
    return "Account already exists";
  }

  if (msg.includes("email not confirmed")) {
    return "Please confirm your email";
  }

  if (msg.includes("network")) {
    return "Network error. Try again";
  }

  return "Something went wrong. Try again";
}

/* LOADING */
function setLoading(btnId, loading, text = "Loading...") {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  if (!btn.dataset.original) {
    btn.dataset.original = btn.innerText;
  }

  btn.disabled = loading;
  btn.innerText = loading ? text : btn.dataset.original;
}

/* FORM SWITCH */
window.toggleForm = () => {
  const login = document.getElementById("loginBox");
  const signup = document.getElementById("signupBox");

  login.style.display = login.style.display === "none" ? "block" : "none";
  signup.style.display = signup.style.display === "none" ? "block" : "none";
};

/* PASSWORD TOGGLE */
window.togglePassword = (id, el) => {
  const input = document.getElementById(id);

  if (input.type === "password") {
    input.type = "text";
    el.innerText = "🙈";
  } else {
    input.type = "password";
    el.innerText = "👁️";
  }
};

/* LOGIN */
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  setLoading("loginBtn", true);

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    window.location.href = "/dashboard";

  } catch (err) {
    alert(cleanError(err.message));
  } finally {
    setLoading("loginBtn", false);
  }
};

/* SIGNUP */
window.signup = async () => {
  const username = document.getElementById("username").value;
  const email = document.getElementById("s_email").value;
  const password = document.getElementById("s_password").value;
  const confirm = document.getElementById("s_confirm").value;
  const usage = document.getElementById("usage").value;

  if (password !== confirm) {
    return alert("Passwords do not match");
  }

  setLoading("signupBtn", true);

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, usage }
      }
    });

    if (error) throw error;

    alert("Account created. Please login.");
    toggleForm();

  } catch (err) {
    alert(cleanError(err.message));
  } finally {
    setLoading("signupBtn", false);
  }
};
