import { supabase } from "./supabase.js";

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return alert(error.message);

  window.location.href = "/dashboard";
};

/* SIGNUP */
window.signup = async () => {
  const email = document.getElementById("s_email").value;
  const password = document.getElementById("s_password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) return alert(error.message);

  alert("Account created");
  toggleForm();
};
