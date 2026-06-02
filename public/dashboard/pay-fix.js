window.pay = async function (btn) {
  try {
    btn.innerText = "Processing...";
    btn.disabled = true;

    const session = await supabase.auth.getSession();
    const token = session.data.session.access_token;

    const res = await fetch("/api/paystack/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        email: window.userState.user.email,
        amount: 5000
      })
    });

    const data = await res.json();

    if (data.data?.authorization_url) {
      window.location.href = data.data.authorization_url;
    } else {
      alert("Payment failed");
    }

  } catch (err) {
    alert(err.message);
  } finally {
    btn.innerText = "Pay Now";
    btn.disabled = false;
  }
};
