import { supabase } from "./supabase.js";

window.toggle = () => {
  const l = document.getElementById("loginBox");
  const s = document.getElementById("signupBox");

  l.style.display = l.style.display === "none" ? "block" : "none";
  s.style.display = s.style.display === "none" ? "block" : "none";
};

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

window.signup = async () => {
  const email = document.getElementById("s_email").value;
  const password = document.getElementById("s_password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) return alert(error.message);

  alert("Account created");
  toggle();
};
