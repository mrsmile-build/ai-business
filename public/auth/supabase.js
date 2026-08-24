import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://qewmhaualndadheoaxkm.supabase.co",
  "sb_publishable_KXIU9BznTzvTdeOHT2w2NA_i8eQPTy5"
);

// Password recovery state.
// IMPORTANT: Do not depend only on the URL hash because Supabase
// consumes the recovery token during session initialization.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    window.__SUPABASE_RECOVERY_ACTIVE__ = true;

    try {
      sessionStorage.setItem("supabase_recovery_active", "true");

      if (session?.user?.email) {
        sessionStorage.setItem(
          "supabase_recovery_email",
          session.user.email
        );
      }
    } catch (e) {}

    // Give auth.js time to finish loading before rendering the UI.
    setTimeout(() => {
      if (typeof window.checkAndRenderRecoveryModal === "function") {
        window.checkAndRenderRecoveryModal();
      }
    }, 0);
  }
});
