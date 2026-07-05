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

### First-Win Onboarding Screen — RESOLVED
Both known gaps fixed and confirmed working end-to-end:
- B2B path: now uses real selected niche (not generic query), shows phone number + working WhatsApp button per result
- B2C path: asks for business name + what they sell before generating; confirmed output mentions both specifically, not generic filler
Known minor issue remaining: occasional wrong-country result in B2B search (see separate roadmap entry above)

---

## NEXT

### Notification triggers — RESOLVED
Added triggers for manual lead add and lead marked Won. Fixed real bug: dropdown was showing stale 30-second-old cached data instead of fetching fresh on open. Added unread count badge (was a plain dot) and relative timestamps (was raw date).

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

### First-win B2B — occasional wrong-country result
Same country-filter logic as main Lead Finder, but a US business ("Main Street ROI") appeared in an Ogun search during testing. Main Lead Finder's `gl=` country param fix may not fully suppress this on every query. Needs a repeat-test to confirm if it's consistent or rare before prioritizing a fix.

---

## Session addendum — new ideas evaluated

### NEXT candidates (buildable soon, no new infrastructure)
- Notification upgrade: unread count badge (not just a dot), read/unread visual distinction, relative timestamps, always fetch fresh on open
- Website Health Checker: fetch a URL, check for WhatsApp button/mobile viewport/CTA/booking form, AI summarizes fixes
- Smart Analytics: plain-English insights generated from existing leads/bookings data (e.g. "Most leads arrive Fridays") — no new data source needed
- Testimonials collection: simple submission form for existing users, stored for landing page use

### LATER (real ideas, need paid/restricted external infrastructure)
- Social Lead Discovery (Reddit/X/LinkedIn monitoring for "need a CRM"-style posts) — X API now paid/restricted
- Competitor Monitor — needs scraping infra + user-defined competitor list
- Review/Comment Opportunity Finder — needs Google My Business + Facebook Graph API, OAuth per business
- Industry-specific landing pages (Hotels/Realtors/Clinics) — natural extension once niche personalization (existing NEXT item) ships

Note: "Lost Lead Recovery" = already-shipped Follow-Up Assistant. "Grow My Business" button = existing "AI Workforce" LATER entry. Not duplicated.

---

## Session addendum — new ideas evaluated

### NEXT candidates (buildable soon, no new infrastructure)
- Notification upgrade: unread count badge (not just a dot), read/unread visual distinction, relative timestamps, always fetch fresh on open
- Website Health Checker: fetch a URL, check for WhatsApp button/mobile viewport/CTA/booking form, AI summarizes fixes
- Smart Analytics: plain-English insights generated from existing leads/bookings data (e.g. "Most leads arrive Fridays") — no new data source needed
- Testimonials collection: simple submission form for existing users, stored for landing page use

### LATER (real ideas, need paid/restricted external infrastructure)
- Social Lead Discovery (Reddit/X/LinkedIn monitoring for "need a CRM"-style posts) — X API now paid/restricted
- Competitor Monitor — needs scraping infra + user-defined competitor list
- Review/Comment Opportunity Finder — needs Google My Business + Facebook Graph API, OAuth per business
- Industry-specific landing pages (Hotels/Realtors/Clinics) — natural extension once niche personalization (existing NEXT item) ships

Note: "Lost Lead Recovery" = already-shipped Follow-Up Assistant. "Grow My Business" button = existing "AI Workforce" LATER entry. Not duplicated.

### First-win B2B customer-targeting bug — RESOLVED
Root cause confirmed via real testing: real estate agents' customers are individual buyers/renters, not searchable businesses. Moved Real Estate to the B2C promo-post flow (alongside salon/restaurant/retail). B2B group is now only agency + tech, both confirmed via real search returning genuine businesses with phone numbers and working WhatsApp links.

### Menu — surface recommended features per niche
Currently only the dashboard shows "Recommended for You." Menu itself has no niche-awareness. Worth revisiting once dashboard version is fully stable.

### Lead Finder — rotating "trending this week" niche suggestions
Idea: instead of static reach-targets, show 5 suggested niches to search that rotate based on current trends. Requires either manual curation or a trend data source — not yet scoped, real LATER item.

### First-win B2B — real estate moved to B2C group
Testing revealed real estate agents' actual customers are individual buyers/renters, not searchable businesses. Lead Finder's B2B search tool structurally cannot find individual consumers (no public business listing to search). Real estate now routes to the B2C promo-post screen alongside salon/restaurant/retail, not Lead Finder. B2B group is now just agency + tech, the two niches that genuinely sell to other findable businesses.

### LATER — AI Meeting Assistant / Voice-to-Business / Smart OCR
Record meetings → transcribe → summarize → extract action items → auto-create reminders/quotations, linked to customer profile. Also: voice commands ("remind me to call X tomorrow") auto-creating leads/reminders/quotations. Also: OCR on receipts/price lists/business cards → structured data. Genuinely large scope: needs speech-to-text API, OCR API, audio storage, and real orchestration logic. Not a quick add — treat as its own project when there's room for it.

Note: "Brain that connects everything" / daily digest vision reframe = same direction as existing "AI Workforce" LATER entry. No new task, just reinforces that direction.

### LATER — AI Meeting Assistant / Voice-to-Business / Smart OCR
Record meetings → transcribe → summarize → extract action items → auto-create reminders/quotations, linked to customer profile. Also: voice commands ("remind me to call X tomorrow") auto-creating leads/reminders/quotations. Also: OCR on receipts/price lists/business cards → structured data. Genuinely large scope: needs speech-to-text API, OCR API, audio storage, and real orchestration logic. Not a quick add — treat as its own project when there's room for it.

Note: "Brain that connects everything" / daily digest vision reframe = same direction as existing "AI Workforce" LATER entry. No new task, just reinforces that direction.
