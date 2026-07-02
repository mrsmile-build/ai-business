# AI Business — Roadmap

This file is the single source of truth for planned work. Update it whenever a new idea comes up or a feature ships — do not rely on chat memory alone.

Status tags: `NOW` (building this session) · `NEXT` (next 1-2 sessions) · `LATER` (real idea, not yet scoped) · `DONE` (shipped, kept for history)

---

## NOW

### Affiliate RLS bug — RESOLVED
Root cause: `authMiddleware` called `.auth.getUser(token)` on the shared service-role Supabase client, silently downgrading it to the logged-in user session for all subsequent requests through that client. Fixed by creating an isolated client per auth check. Confirmed via fresh signup enrolling cleanly. Withdraw path not independently tested yet (same root cause and fix, high confidence).

### Landing Page Rewrite (5-second clarity test)
Current homepage is feature-listy. Rewrite hero to lead with outcome, not capability.
- Headline: pain/outcome framing ("Stop Losing Customers" style), not "AI-powered CRM"
- Before/After section
- One CTA, repeated, not buried among many

### First-Win Onboarding Screen — fix known gaps
Built and tested this session, but two real gaps identified before wider rollout:
- B2B path: show phone number + working "Send WhatsApp" per result (not just names)
- B2C path: ask for business name + what they sell BEFORE generating the promo post — current version produces generic filler when profile is empty

---

## NEXT

### Notification triggers — expand beyond the 3 rare events
Bell currently only fires on: widget chat lead, booking, public enquiry form. Daily-use actions (manual lead add, Lead Finder run, follow-up marked done) trigger nothing.

### Niche data → actually personalize something
Multi-select business type is captured and saved correctly but powers zero personalization yet.

---

## LATER (real ideas, not yet scoped)

### "AI Workforce" (consolidates: AI Employee reframe + AI Employee Marketplace + Work Analytics)
One umbrella dashboard section instead of 8+ separate top-level features. Sub-modules: Receptionist, Follow-Up Assistant, Sales Assistant, Social Assistant, Reports Assistant (=Work Analytics).
Caveat: marketing can say "AI employee" as metaphor, but don't let framing outrun real capability — everything currently still needs a human to read/send.

### Interactive homepage demo
Visitor types a question into a sample AI before signing up, gets a real generated response using sample data.

---

## DONE (recent, for context)
- Multi-backend failover (Railway/Render) + Vercel static frontend
- Public business page + working enquiry form → creates real leads
- Booking page: services loader timeout + retry, single-service auto-select
- Business page save: real error surfacing (slug-taken detection)
- Affiliate dashboard: balance, commission breakdown, link, conversions, withdrawal history, bank dropdown
- First-win onboarding screen, B2B/B2C branch
