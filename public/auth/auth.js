import { supabase } from "/auth/supabase.js";

const API_BACKENDS = [
  "https://ai-business-production.up.railway.app",
  "https://ai-business-1-ok3x.onrender.com"
];
let _activeBackend = null;
let _backendCheckPromise = null;

async function resolveBackend(){
  if(_activeBackend) return _activeBackend;
  if(_backendCheckPromise) return _backendCheckPromise;
  _backendCheckPromise = (async function(){
    for(var i=0;i<API_BACKENDS.length;i++){
      var url = API_BACKENDS[i];
      try {
        var ctrl = new AbortController();
        var t = setTimeout(function(){ ctrl.abort(); }, 4000);
        var res = await fetch(url + "/api/status", { signal: ctrl.signal });
        clearTimeout(t);
        if(res.ok){ _activeBackend = url; return url; }
      } catch(e){}
    }
    _activeBackend = API_BACKENDS[0];
    return _activeBackend;
  })();
  return _backendCheckPromise;
}

async function apiFetch(path, options){
  var backend = await resolveBackend();
  try {
    return await fetch(backend + path, options);
  } catch(e){
    _activeBackend = null;
    _backendCheckPromise = null;
    var backend2 = await resolveBackend();
    return fetch(backend2 + path, options);
  }
}

/* =========================
   SMART ERROR MAPPER
========================= */
function getErrorMessage(err) {
  if (!err) return "Something went wrong";

  const msg = (err.message || "").toLowerCase();

  // NETWORK ERRORS
  if (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("failed to fetch")
  ) {
    return "Network error. Check your connection.";
  }

  // AUTH ERRORS
  if (msg.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (msg.includes("user already registered")) {
    return "Account already exists.";
  }

  if (msg.includes("email not confirmed")) {
    return "Please confirm your email.";
  }

  if (msg.includes("user not found")) {
    return "Account does not exist.";
  }

  return "Something went wrong. Try again.";
}

/* =========================
   FORM VALIDATION
========================= */
function validateLogin(email, password) {
  if (!email || !password) {
    return "Please fill all fields.";
  }
  return null;
}

function validateSignup(username, email, password, confirm) {
  if (!username || !email || !password || !confirm) {
    return "Please fill all fields.";
  }

  if (password !== confirm) {
    return "Passwords do not match.";
  }

  return null;
}

/* =========================
   FORM TOGGLE
========================= */
window.toggleForm = () => {
  const login = document.getElementById("loginBox");
  const signup = document.getElementById("signupBox");

  login.style.display = login.style.display === "none" ? "block" : "none";
  signup.style.display = signup.style.display === "none" ? "block" : "none";
};

/* =========================
   PASSWORD TOGGLE
========================= */
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

/* =========================
   LOGIN
========================= */
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!document.getElementById("terms_agree")?.checked) return alert("Please agree to the Terms and Conditions to continue.");
  const check = validateLogin(email, password);
  if (check) return alert(check);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    localStorage.setItem("token", data.session.access_token);
    localStorage.setItem("refresh_token", data.session.refresh_token);
    window.location.href = "/dashboard";
  } catch (err) {
    alert(getErrorMessage(err));
  }
};

/* =========================
   SIGNUP
========================= */
window.signup = async () => {
  const username = document.getElementById("username").value;
  const email = document.getElementById("s_email").value;
  const password = document.getElementById("s_password").value;
  const confirm = document.getElementById("s_confirm").value;
  const usage = document.getElementById("usage").value;
  const phone = document.getElementById("s_phone")?.value||"";
  const country = document.getElementById("s_country")?.value||"Nigeria";

  if(!document.getElementById("signup_terms")?.checked) return alert("Please agree to the Terms and Conditions to continue.");
  const check = validateSignup(username, email, password, confirm);
  if (check) return alert(check);

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, usage, phone, country }
      }
    });

    if (error) throw error;

    // Track referral
    const refCode = new URLSearchParams(window.location.search).get('ref');
    if(refCode){
      apiFetch('/api/referral/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({referral_code:refCode,email})}).catch(()=>{});
    }
    if(typeof gtag!=='undefined'){gtag('event','sign_up',{method:'email'});}
    apiFetch('/api/welcome-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,name:username})}).catch(()=>{});
    alert("Account created. Please login.");
    toggleForm();
  } catch (err) {
    alert(getErrorMessage(err));
  }
};

window.forgotPassword = async () => {
  const email = document.getElementById("email").value.trim();
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if(error) throw error;
    alert("Password reset link sent to " + email + ". Check your inbox.");
  } catch(err) {
    alert("Error: " + (err.message||"Could not send reset email."));
  }
};
