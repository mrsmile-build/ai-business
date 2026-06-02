import { supabase } from "./supabase.js";

/* SWITCH FORM */
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

/* SIGNUP V2 */
window.signup = async () => {
  const username = document.getElementById("username").value;
  const email = document.getElementById("s_email").value;
  const password = document.getElementById("s_password").value;
  const confirm = document.getElementById("s_confirm").value;
  const usage = document.getElementById("usage").value;

  if (!username || !email || !password || !confirm) {
    return alert("Fill all fields");
  }

  if (password !== confirm) {
    return alert("Passwords do not match");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        usage
      }
    }
  });

  if (error) return alert(error.message);

  alert("Account created. Login now.");
  toggleForm();
};
