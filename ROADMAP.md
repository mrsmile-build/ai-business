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



### LATER — AI Inbox (draft-and-approve for inbound messages)
Distinct from existing Follow-Up Assistant (which drafts outbound to cold leads). This is: AI reads an incoming customer message, drafts a reply, owner approves/edits before sending. Needs a real inbound message source first (currently only the widget captures inbound text) — likely blocked on WhatsApp Business API access, same constraint as other WhatsApp-automation ideas already ruled out as paid/restricted.

### LATER — Business Memory per customer
Structured fields beyond current lead notes: birthdays, payment promises with dates, stated preferences. Would need new lead sub-fields + UI to capture/display them, plus logic to resurface at the right time (e.g. "John's birthday is in 3 days").

Note: daily-priorities dashboard, Health Score, Lost Revenue Alerts = already covered by existing "AI Workforce" LATER entry. Meeting Assistant / Voice Commands = already logged in prior entry. Not duplicated.



### First-win B2B agency targeting — VERIFIED
Confirmed via real HasData query: "retail shops [city]" returns 19/20 results with phone numbers (tested Ogun). Real, working fix — not exhaustive (skews toward grocery/retail, doesn't surface every small-business type an agency might target), but a genuine, verified improvement over the original broken abstract phrasing.

### First-win multi-niche routing — RESOLVED
Was only checking the first saved niche; now checks all selected niches for a B2B match. Confirmed via real test: Agency + Restaurant combo correctly routes to B2B Lead Finder screen with real results. Known simplification: mixed B2B/B2C selections only show one first-win experience (B2B takes priority), not both — reasonable tradeoff for a single onboarding moment.

### LATER — Big-vision ideas (Digital Twin, Business Relationship Engine, AI Business Scientist, etc.)
Multiple sessions have produced large-scope vision documents: Business Digital Twin (simulate decisions before spending), Cause-and-Effect reasoning, AI A/B testing WhatsApp messages at scale, Business Relationship Engine (Result = f(State, Relationship, Action)), Risk Predictor, AI CEO daily priorities. All genuinely large research-grade AI problems, not buildable as quick features — several need data/scale (500+ customers) the platform doesn't have yet. Each document's own conclusion agrees: start small, ship one thing well first. Treat as long-term direction only, not near-term scope. Opportunity Finder specifically = Lead Finder + approval step, mostly already exists, smaller than the framing suggests - worth a scoped look later, not full rebuild.

---

## Standing filter for new feature ideas
Before adding anything new, ask: does it help the business (1) get more customers, (2) convert more leads to sales, (3) keep customers coming back, (4) save significant time, or (5) make better decisions? If no, question whether it belongs in the product yet, regardless of how interesting the idea is.

### LATER — Industry-specific recommendation matching
Real estate matches customers to properties, phone shop recommends the right phone, travel agency recommends packages, hotel recommends rooms — AI Business as a matching assistant per industry, not just a customer database. Explicitly sequenced by the person proposing it as after first real users + improved onboarding, positioned as a future premium feature, not core rebuild. Good shape for a LATER item — no action needed now.

### LATER — Lead Finder 2.0 / Lead Intelligence
Buying signals (hiring, funding, LinkedIn activity, ad spend), AI Opportunity Score, Pain Detection. Genuinely blocked on data: LinkedIn/hiring/ad-library data all need paid or restricted APIs not currently integrated. Real risk if built on current HasData fields alone: scores/signals would be invented, not real - avoid overclaiming. One honestly buildable piece using data already fetched: review-count-based framing (e.g. "new listing, few reviews yet") could inform icebreaker messages without inventing anything.

### URGENT — single point of failure, only one backend remains
Railway expired and was removed from failover. Only ai-business-1-ok3x.onrender.com remains. If this Render free trial also expires, the entire site goes offline with zero fallback. Need to either: add a second free backend back into rotation, or budget for Render's paid always-on tier once first paying customer covers it. Do not let this sit unaddressed.

### LATER — Voice Receptionist (3-phase: browser → WhatsApp → phone)
Phase 1 (browser "Talk to AI" button, speech-to-text/text-to-speech, no phone number) is genuinely buildable free - deserves its own dedicated session. Phase 2 (WhatsApp) and Phase 3 (Twilio-class telephony) duplicate already-logged blockers (Meta API access, paid telephony costs).

### LATER — Opportunity Feed (evolution of Lead Finder 2.0 idea)
Reframe from manual search to automatic daily feed. Most signals (funding, LinkedIn activity) still blocked per earlier entry. One real, free, buildable piece: Google News RSS feeds, no API key needed - could surface real news mentions (grand openings, expansions) as an honest signal, worth a small scoped build on its own rather than the full opportunity-score vision.
