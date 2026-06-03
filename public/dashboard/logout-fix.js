window.logout = async function () {
  const ok = confirm("Are you sure you want to logout?");
  if (!ok) return;

  await supabase.auth.signOut();
  window.location.href = "/auth";
};
