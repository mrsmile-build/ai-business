import { supabase } from "/auth/supabase.js";

// Track affiliate link clicks - raw page-load count, not de-duplicated per visitor
(function(){
  const affCode = new URLSearchParams(window.location.search).get('aff');
  if(affCode){
    apiFetch('/api/affiliate/track-click',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({affiliate_code:affCode})}).catch(function(){});
  }
})();

const API_BACKENDS = [
  "https://ai-business-1-ok3x.onrender.com",
  "https://ai-business-1orz.onrender.com"
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
    apiFetch('/api/profile/seed-phone',{method:'POST',headers:{'Content-Type':'application/json'}}).catch(()=>{});
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
    const { data, error } = await supabase.auth.signUp({
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
    // Track affiliate (Affiliate Program) - separate system, separate param
    const affCode = new URLSearchParams(window.location.search).get('aff');
    if(affCode && data?.user?.id){
      apiFetch('/api/affiliate/track-signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({affiliate_code:affCode,user_id:data.user.id})}).catch(()=>{});
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
    if(error) throw error;
    alert("Password reset link sent to " + email + ". Check your inbox.");
  } catch(err) {
    alert("Error: " + (err.message||"Could not send reset email."));
  }
};

/* =========================================================
   PASSWORD RECOVERY
   ========================================================= */

window.checkAndRenderRecoveryModal = async function () {
  let recoveryActive = false;
  let userEmail = "Account Recovery";

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      userEmail = session.user.email || userEmail;
    }

    recoveryActive =
      window.__SUPABASE_RECOVERY_ACTIVE__ === true ||
      sessionStorage.getItem("supabase_recovery_active") === "true";

  } catch (e) {
    console.error("Recovery session check failed:", e);
  }

  if (!recoveryActive) return;

  if (document.getElementById("auth-fullscreen-recovery")) return;

  const overlay = document.createElement("div");

  overlay.id = "auth-fullscreen-recovery";

  overlay.style.cssText = `
    position:fixed;
    inset:0;
    width:100vw;
    height:100vh;
    background:#080c14;
    z-index:999999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    box-sizing:border-box;
    font-family:Arial,sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      width:100%;
      max-width:400px;
      background:#111a2e;
      border:1px solid #243451;
      border-radius:16px;
      padding:28px;
      box-sizing:border-box;
      color:white;
      box-shadow:0 20px 50px rgba(0,0,0,.5);
    ">

      <div style="text-align:center;margin-bottom:22px">
        <div style="font-size:32px">📊</div>

        <h2 style="
          margin:10px 0 6px;
          font-size:23px;
        ">
          Set New Password
        </h2>

        <p style="
          margin:0;
          color:#94a3b8;
          font-size:13px;
        ">
          Create a new password for your AI Business account.
        </p>
      </div>

      <div style="margin-bottom:16px">
        <label style="
          display:block;
          color:#94a3b8;
          font-size:12px;
          margin-bottom:6px;
        ">
          Account Email
        </label>

        <input
          type="email"
          value="${userEmail.replace(/"/g, "&quot;")}"
          disabled
          style="
            width:100%;
            padding:12px;
            box-sizing:border-box;
            border-radius:8px;
            border:1px solid #243451;
            background:#0b1220;
            color:#64748b;
          "
        >
      </div>

      <div id="recovery-message"
        style="
          display:none;
          padding:10px;
          border-radius:8px;
          margin-bottom:15px;
          font-size:13px;
          text-align:center;
        ">
      </div>

      <form id="recovery-form">

        <div style="margin-bottom:16px">

          <label style="
            display:block;
            color:#94a3b8;
            font-size:12px;
            margin-bottom:6px;
          ">
            New Password
          </label>

          <input
            id="recovery-password"
            type="password"
            minlength="6"
            required
            placeholder="Enter new password"
            style="
              width:100%;
              padding:12px;
              box-sizing:border-box;
              border-radius:8px;
              border:1px solid #243451;
              background:#0b1220;
              color:white;
            "
          >

        </div>

        <div style="margin-bottom:20px">

          <label style="
            display:block;
            color:#94a3b8;
            font-size:12px;
            margin-bottom:6px;
          ">
            Confirm New Password
          </label>

          <input
            id="recovery-confirm"
            type="password"
            minlength="6"
            required
            placeholder="Confirm new password"
            style="
              width:100%;
              padding:12px;
              box-sizing:border-box;
              border-radius:8px;
              border:1px solid #243451;
              background:#0b1220;
              color:white;
            "
          >

        </div>

        <button
          id="recovery-submit"
          type="submit"
          style="
            width:100%;
            padding:13px;
            border:0;
            border-radius:8px;
            background:#2563eb;
            color:white;
            font-weight:bold;
            cursor:pointer;
          "
        >
          Save New Password
        </button>

      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  document
    .getElementById("recovery-form")
    .addEventListener("submit", window.handlePasswordRecovery);
};


window.handlePasswordRecovery = async function (event) {
  event.preventDefault();

  const password =
    document.getElementById("recovery-password").value;

  const confirm =
    document.getElementById("recovery-confirm").value;

  const message =
    document.getElementById("recovery-message");

  const button =
    document.getElementById("recovery-submit");

  if (password.length < 6) {
    message.style.display = "block";
    message.style.background = "rgba(239,68,68,.15)";
    message.style.color = "#f87171";
    message.textContent =
      "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    message.style.display = "block";
    message.style.background = "rgba(239,68,68,.15)";
    message.style.color = "#f87171";
    message.textContent =
      "Passwords do not match.";
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  try {

    const { error } =
      await supabase.auth.updateUser({
        password: password
      });

    if (error) throw error;

    message.style.display = "block";
    message.style.background = "rgba(16,185,129,.15)";
    message.style.color = "#34d399";
    message.textContent =
      "Password updated successfully.";

    sessionStorage.removeItem("supabase_recovery_active");
    sessionStorage.removeItem("supabase_recovery_email");

    setTimeout(async () => {

      try {
        await supabase.auth.signOut();
      } catch (e) {}

      window.location.href = "/auth";

    }, 1500);

  } catch (error) {

    console.error("Password update error:", error);

    message.style.display = "block";
    message.style.background = "rgba(239,68,68,.15)";
    message.style.color = "#f87171";
    message.textContent =
      error?.message ||
      "Could not update password.";

    button.disabled = false;
    button.textContent = "Save New Password";
  }
};


/*
   Supabase may fire PASSWORD_RECOVERY before or after
   auth.js finishes loading, so listen for it and also
   perform an explicit startup check.
*/

supabase.auth.onAuthStateChange((event, session) => {

  if (event === "PASSWORD_RECOVERY") {

    window.__SUPABASE_RECOVERY_ACTIVE__ = true;

    try {
      sessionStorage.setItem(
        "supabase_recovery_active",
        "true"
      );

      if (session?.user?.email) {
        sessionStorage.setItem(
          "supabase_recovery_email",
          session.user.email
        );
      }
    } catch (e) {}

    setTimeout(() => {
      window.checkAndRenderRecoveryModal();
    }, 100);
  }

});


setTimeout(() => {
  window.checkAndRenderRecoveryModal();
}, 500);
