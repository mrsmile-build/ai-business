import { supabase } from "./supabase.js";

/* UI STATE HELPERS */
function setLoading(btnText, loading) {
  const btn = document.querySelector(`button[data-role='${btnText}']`);
  if (!btn) return;

  btn.disabled = loading;
  btn.innerText = loading ? "Loading..." : btn.dataset.original;
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

/* RETRY WRAPPER */
async function safeRequest(fn, retries = 2) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      return await safeRequest(fn, retries - 1);
    }
    throw err;
  }
}

/* LOGIN */
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const btn = document.getElementById("loginBtn");

  try {
    if (btn) {
      btn.dataset.original = btn.innerText;
      setLoading("login", true);
    }

    await safeRequest(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    });

    window.location.href = "/dashboard";

  } catch (err) {
    alert("Login failed. Check network and retry.");
  } finally {
    setLoading("login", false);
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

  try {
    await safeRequest(async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, usage }
        }
      });
      if (error) throw error;
    });

    alert("Account created. Please login.");
    toggleForm();

  } catch (err) {
    alert("Signup failed. Retrying may help.");
  }
};
