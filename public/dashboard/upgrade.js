window.openUpgrade = async function (btn) {
  try {
    if (btn) {
      btn.innerText = "Loading...";
      btn.disabled = true;
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session.access_token;

    const res = await fetch("/api/paystack/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        email: window.userState?.user?.email,
        amount: 5000
      })
    });

    const data = await res.json();

    const url = data?.data?.authorization_url;

    if (url) {
      window.location.href = url;
    } else {
      alert("Upgrade failed");
    }

  } catch (err) {
    alert(err.message);
  }
};
