async function submitLead() {

  const name =
    document.getElementById("name").value;

  const phone =
    document.getElementById("phone").value;

  const message =
    document.getElementById("message").value;

  const res = await fetch("/api/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      phone,
      message
    })
  });

  const data = await res.json();

  document.getElementById("result").innerText =
    "Lead Saved!";
}
