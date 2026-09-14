# AI Business — Roadmap

This file is the single source of truth for planned work, product vision, and architectural memory.

### Status Categories
- **NOW**: The single active focus (building/fixing this session).
- **NEXT**: Highest-value items immediately following NOW (next 1-2 sessions).
- **LATER**: Validated ideas needing more users, data, or infrastructure.
- **FUTURE**: Business OS / network vision, and research-grade experimental concepts.
- **DONE/RESOLVED**: The *specific scope described in the entry* was implemented and verified. It does NOT mean the broader feature area is finished forever; future enhancements live under NEXT/LATER. "Code changed" ≠ "feature verified."

---

## PRODUCT PRINCIPLES & ARCHITECTURE
(The philosophy and structure underneath every feature. Not feature entries; permanent architectural memory.)

### Beginner-first, outcome-driven UX
- Every screen must be understandable by a first-time, non-technical business owner.
- Core interaction model: ask **"What are you trying to accomplish?"** and route into the right workflow (Command Center implements this; the philosophy applies everywhere).
- AI Business should feel like a business partner/operator, not a toolbox of disconnected features.

### The Proactive Intelligence Chain
Business event → Activity signal → Notification / insight → Recommended action → User executes → Outcome recorded → Better recommendations.
- **Menu activity signals** are *evidence of activity*, not notifications. Over time they feed the notification / Next Best Action layer.
- **Notification philosophy:** AI Business eventually tells the owner what needs attention without being asked (e.g., "3 leads waiting for follow-up", "Customer hasn't returned in 45 days", "Activity dropped this week").
- Notifications → Next Best Action → Proactive AI is **one architecture**, not three products.

### Connected Intelligence Principle
AI Business progressively understands the relationships between leads, customers, conversations, bookings, proposals, invoices, payments, activity, retention and performance, so that actions in one part of the system inform recommendations in another. This is the "brain" underneath the product.

### AI Workforce Control Model
**Observe → Recommend → Draft → Ask Approval → Execute → Measure.**
Low-risk actions may become automated over time; sensitive actions remain approval-based. Safe path: AI assistant → AI agent → AI workforce.

### WhatsApp = Channel; AI Business = System of Record
WhatsApp is where conversations happen. AI Business is where the business understands, organizes, follows up, books, retains and measures those interactions. Automation subject to Meta API access/cost constraints.

### Trust & Moat Principle
Long-term goal: businesses on AI Business become **trusted + visible + credible + partnership-ready**.
The moat is not "we have business data." It is: AI Business knows who businesses are, what they do, what they have done, how trustworthy they are, who they serve, who they work with, and how they perform.

### Standing Rules
- **No fabricated numbers, ever:** Any AI score/insight must be backed by real, defensible data.
- **Standing filter:** Every idea must help the business (1) get more customers, (2) convert more leads, (3) keep customers coming back, (4) save significant time, or (5) make better decisions.

---

## NOW

### NOW — choose next focus (candidates below)
My Page booking prominence is DONE (see DONE section). Candidates: Lead Finder 2.0 / Signal System (NEXT), Business Strength Score (analytics exists), Customer Retention Engine (LATER).

### Appointment System Hardening — COMPLETE
All five slices DONE (see DONE section). Closed at v1.3.4.
3. Rescheduling and cancellation flows.
4. Reminders.
5. Booking → customer/lead linkage; status transitions tracked for Analytics.

---

## NEXT

### Product-led distribution (brand marks on free-plan artifacts)
Free-plan artifacts carry a small permanent brand, turning user activity into discovery. Shipped: business page badge and outreach message mark (v1.4.1). Next candidates: proposal and invoice marks, booking confirmation pages. Must stay subtle to respect the customer's brand.

### Lead Finder 2.0 / Signal System
FIND → UNDERSTAND → CONTACT → FOLLOW UP → CONVERT, built on honest signals (review count, new-listing framing, contact availability). No invented buying signals. Legal constraint: only sources with explicit programmatic access (HasData, public RSS); no scraping against robots.txt/ToS, no CAPTCHA bypass.

**Phase 1 (DONE):** Smart filters (new businesses, no website, high reviews, high rating).
**Phase 2 (NEXT):** Bulk outreach - tick boxes on leads, one message template, send to all selected via WhatsApp with personalization.
**Phase 3 (LATER):** Pipeline polish - kanban view of lead status (new → contacted → replied → won).

### Smart Analytics & Weekly Performance
Plain-English insights from real stored data (leads, follow-ups, messages, bookings, conversions). Menu activity badges as evidence of activity, distinct from notifications; weekly timeline view.

### Command Center Phase 1
Intent → existing workflow routing ("I need more customers" → Lead Finder). No major new AI infrastructure. The visible start of the "What are you trying to accomplish?" model.

### Landing Page Outcome Positioning
5-second clarity test; outcome headline; Before/After; one primary CTA repeated; features support the outcome story.

### AI Workforce / AI Agents
Receptionist, Follow-Up Assistant, Sales Assistant, Social Assistant, Reports Assistant — built around real workflows with the approval model from Principles.

### Invoice & Receipt System
Invoices, due dates, payment status, receipts, connected to customers/leads. Not an accountant replacement.

### Business Page Builder
Stronger public page: services, contact CTA, lead capture, booking, shareable URL, mobile-first, SEO-friendly.

### Website Health Checker
Real checks (mobile viewport, WhatsApp/contact option, CTA, booking/enquiry form, basic info) → prioritized AI improvement report. No invented results.

---

## LATER

### Customer Retention Engine
Lifecycle: **New → Active → Repeat → At-risk → Lost.**
Retention intelligence: last activity, purchase frequency, average value, repeat frequency, days since last purchase, upcoming important dates, communication history, satisfaction/review history, retention risk.
Engine loop: **Detect → Explain → Recommend → Act → Measure.**

### Connected Sales Workflow & Customer Intelligence
Master journey: **Lead → Contact → Follow-up → Booking → Proposal → Invoice → Payment → Customer → Retention.**
Business Memory: structured fields (preferences, important dates, payment promises, interaction history, value, risk) connected to real customer records, resurfaced at the right time.

### Data Quality, Import & Migration
CSV/Excel import → clean → deduplicate → organize. Duplicate lead/customer detection, invalid phone detection, missing-info alerts, record merging.

### WhatsApp-First Infrastructure Layer
Strategic channel integration for leads, follow-ups, bookings, reminders, conversations, retention, notifications — with AI Business as system of record.

### AI Inbox
Draft-and-approve for inbound messages (distinct from outbound Follow-Up Assistant). Blocked on a reliable inbound message source.

### Voice Receptionist (3-phase)
Phase 1 browser "Talk to AI" (STT/TTS, free, buildable); Phase 2 WhatsApp voice; Phase 3 telephony — only with a business case.

### AI Meeting / Voice / OCR Assistant
Transcribe → summarize → action items → reminders/quotations; voice commands; OCR receipts/price lists/cards. Large scope; defer.

### Industry-Specific Intelligence & Opportunity Feed
Per-industry matching as premium capability after real users. Opportunity Feed via free honest sources (Google News RSS: openings, expansions).

### Multilingual AI Business
Translation-key architecture across menu, dashboard, forms, notifications, AI responses.

### Vision-2 specifics
Business Strength Score (real dimensions); Proof of Work (structured project records, distinct from testimonials); Outcome Funnel (Contacted → Replied → Interested → Quote → Booking → Paid → Reviewed); Next Best Action / proactive layer.

---

## FUTURE — Business OS & Network

### Business Operating System (2.0) full scope
Customers, leads, suppliers, products/services, inventory, orders, payments, appointments, invoices, expenses, business documents, customer records, supplier relationships, business activity, business intelligence, marketing, AI Workforce.

### Marketplace (3.0), Verification & Trust (4.0), Transactions (5.0)
Supplier discovery, quotations, orders, ratings; business verification and reputation; connected transaction infrastructure. Long-term network: businesses discover, transact and build relationships through AI Business.

---

## FUTURE — Research / Experimental
Business Digital Twin; AI Business Scientist; AI CEO daily priorities; cause-and-effect reasoning; advanced experimentation (AI A/B testing messages at scale); risk prediction; deeper autonomous business intelligence. Research-grade; must never delay shipping the core product.

---

## DONE / RESOLVED
*(Scope rule: the described scope shipped and was verified. Broader areas may still evolve under NEXT/LATER.)*

- **Appointment Booking — customer-side flow: VERIFIED WORKING, no bug present.** Single + multi service selection, submission, confirmation screen, and zero-service guard all verified on the live build with real bookings. The previously reported "service-selection bug" does not exist in the current code; entry closed as verified, not fixed.
- **Owner-side booking visibility — RESOLVED.** Root cause: shared service-role client had its auth session mutated by `auth.refreshSession()` and `auth.signInWithPassword()`, downgrading later shared-client operations under RLS; notification inserts and bookings reads failed silently (swallowed catches). Fixed with fresh local clients in `/api/refresh`, `/api/change-password`, `pushNotification`, `GET/PATCH /api/bookings`. Verified on localhost (notification row written, dashboard lists all bookings, counts correct) and live on ok3x (bell badge, bookings listed, status transitions persist).
- **Lead Finder quota & UI sync** — atomic RPC increment, fresh local clients, sequential HasData calls, Groq retry, instant + persistent UI counter. Verified live; tagged `v1.2.0-lead-finder-stable`.
- **Affiliate shared-client contamination** — root cause fixed; join / track-click / track-signup / stats / withdraw all on isolated clients. Caveat kept: affiliates table RLS still disabled; enabling RLS is a separate, not-started task.
- **First-Win Onboarding (defined scope)** — B2B/B2C routing verified with real searches; real estate correctly in B2C; multi-niche routing verified. Broader activation philosophy continues to evolve.
- **Notification upgrades (defined scope)** — triggers for lead add / lead won, unread badge, relative timestamps, fresh fetch on open. Broader proactive philosophy lives in Principles + Next Best Action.
- **Niche personalization** — NICHE_FEATURES rules engine, all 8 types, multi-niche dedup, verified by reading real code.
- **Backend redundancy** — Render failover list restored in auth.js + dashboard/app.js. Residual gap noted: vercel.json static rewrites still single-backend.
- **Testimonials collection** — full CRUD + moderation + public API + homepage auto-load, verified incl. avatar HTTP 200.
- **Public business page + enquiry form** — creates real leads; slug-taken error surfacing.
- **Booking page earlier fixes** — services loader timeout/retry, single-service auto-select, multi-service selection.
- **Appointment hardening slice 1 — server-side slot integrity (verified across all 3 Render backends).** Past-date rejection proven by direct API call bypassing the UI on ok3x, 1orz, and 90n6; HH:MM time-format validation; duration-aware double-booking overlap prevention proven by a real conflicting attempt; specific error surfacing on the public booking page; isolated service-role client on the public services endpoint. Rejected bookings no longer trigger owner notifications.
- **Appointment hardening slice 2 — working hours, breaks, blocked dates (verified on localhost).** Schema: `booking_hours` jsonb + `blocked_dates` jsonb on `biz_pages` (null preserves legacy 08:00–18:00). Owner UI: per-day hours with closed toggle + break + unavailable-date chips, labeled columns, plain-English helpers, wipe-safe init. Customer UI: time dropdown dynamically generated from saved hours minus breaks and duration overrun; closed/blocked days show explicit messages. Server enforcement: blocked dates, closed days, open/close window, break intersection all reject with specific errors before the overlap check. Verified: exact Monday slot list (10/11/12/14/15 for 10:00–16:00 with 13:00–14:00 break), closed-day and blocked-date messages, chip persistence, success path with hours set.
- **Appointment hardening slice 3 — rescheduling and cancellation (verified on localhost).** PATCH /api/bookings/:id extended with full validation chain (past date, time format, blocked date, closed day, hours/breaks, overlap excluding self). Owner UI: Reschedule button opens inline date + time inputs generated from saved availability; closed/blocked days show inline messages; Save New Time triggers validation and updates. Status-only PATCH unchanged. Verified: overlap rejection, closed-day rejection, blocked-date rejection, valid reschedule, vacated slot immediately rebookable, cancellation frees slot for rebooking. Customer-side reschedule/cancel deferred (requires secure-token mechanism).
- **Appointment hardening slice 4 — 24h reminders (verified on localhost).** bookings.reminder_sent_at column; GET /api/bookings sweeps bookings starting within 24h (not cancelled, not yet reminded) and sends bell notification + owner email + customer email when present, then marks as reminded; reschedule resets the flag so moved bookings remind again; no daemon or cron (sweep runs on owner dashboard load); emails skip gracefully without RESEND_API_KEY. Verified: only within-24h bookings reminded (past and far-future skipped), no duplicate on repeat open, fresh reminder after reschedule.
- **Appointment hardening slice 5 — booking-to-lead linkage, activity log, past-time gate (verified on localhost and all 3 live backends).** New bookings link to CRM leads by phone (existing lead set to won with follow_up_date = booking date; missing lead created); bookings.lead_id stores the link; repeat bookings reuse the same lead. Activity log rows: booking_created, booking_confirmed, booking_cancelled, booking_rescheduled with details jsonb. Creation and reschedule reject same-day past times. Verified: past-time rejection on ok3x, 1orz and 90n6 by direct API call; lead created once as won and reused; activity rows for created, confirmed and rescheduled.
- **Booking & activity analytics (verified on localhost).** GET /api/booking-analytics (read-only): totals by status, confirmation rate, busiest day and hour, service popularity, 30-day confirmed revenue, 7-day bookings-per-day series, recent bookings. Analytics page shows a Bookings block (stat cards, bar chart, popularity bars, recent list) beside existing lead pipeline stats; lead stats unchanged. Verified: cards match DB counts after test cleanup (17 total, popularity sums to 17), charts render, no regression.
- **My Page booking prominence + clean brand mark (verified on localhost and live).** Owner Business Page gains a Share card: QR code of the page link, 1-tap WhatsApp share, copy link, copy bio text, 6-point share checklist. Public page footer replaced by a small permanent centered "AI Business" mark (free plan cannot remove). Lead Finder free-plan branding moved out of the editable box: Copy/Share/Send WhatsApp append "- AI Business" at send time, pro appends nothing; broken Send WhatsApp link rewired to carry the edited message. Verified: badge no longer covers buttons, QR and checklist render, box stays clean while copied and WhatsApp texts end with the mark. Schema: `booking_hours` jsonb + `blocked_dates` jsonb on `biz_pages` (null preserves legacy 08:00–18:00). Owner UI: per-day hours with closed toggle + break + unavailable-date chips, labeled columns, plain-English helpers, wipe-safe init. Customer UI: time dropdown dynamically generated from saved hours minus breaks and duration overrun; closed/blocked days show explicit messages. Server enforcement: blocked dates, closed days, open/close window, break intersection all reject with specific errors before the overlap check. Verified: exact Monday slot list (10/11/12/14/15 for 10:00–16:00 with 13:00–14:00 break), closed-day and blocked-date messages, chip persistence, success path with hours set.
- **Proposal generator fixes (verified on localhost and live).** Exact typed price now appears in Investment section (no more inflated amounts); current date injected into Cover/Header (no more 2023); Groq token limits handled with concise prompt and 990 token cap to fit free tier. Verified: date shows 2026, price shows exact amount typed.
- **Proposal brand mark (verified on localhost).** Free-plan proposals append "— AI Business" at copy/share time; pro users can turn off. Computed at action time from subscription plan. Verified: pasted text ends with brand mark on free plan.
- **Blog photo gallery picker (verified on localhost and live).** Replaced "paste image URL" text box with "Choose Cover Image from Gallery" button that opens phone's photos/files/camera. Images upload to Supabase Storage (auto-creates bucket on first use), thumbnail preview shows in editor, public blog list and single post pages render the cover photo. Verified: 200 OK on image URLs, photos display on /blog list and /blog/:slug pages.
- **Lead Finder brand mark (verified on localhost).** Free-plan outreach messages append "— AI Business" at send time (copy/share/WhatsApp); pro appends nothing. Mark moved out of editable box to respect user editing. Verified: copied message ends with brand mark, box stays clean while editing.
- **Lead Finder 2.0 Phase 1: Smart filters (verified on localhost and live).** Four filter checkboxes: "New businesses (<10 reviews)", "No website", "High reviews (50+)", "High rating (4.5+)". Backend filters HasData results before returning; online leads excluded when filtering. Verified: "No website" filter returns zero cards with Website button; "High reviews" filter returns only 50+ review businesses.

---

## ROADMAP GOVERNANCE
1. Determine whether a new idea is already represented; if yes, refine the existing entry — never duplicate.
2. If genuinely new, add to the correct status section with the smallest useful version.
3. Build → test the real workflow → deploy → mark DONE with evidence → move on. One NOW item at a time.
4. DONE means the described scope shipped and was verified; it never closes the broader area to future improvement.
5. Preserve historical and architectural memory; consolidate, never erase.

---

## SaaS Intelligence & Opportunity Expansion

### Strategic Direction

AI Business should evolve beyond a collection of business tools into a connected business growth system that helps a business move from discovery to trust, opportunity, conversion, payment, and proof.

Core loop:

**Get Found → Look Credible → Find Opportunities → Convert → Follow Up → Get Paid → Build Proof → Grow Trust**

These capabilities are inspired by validated patterns observed across SaaS products and builder communities. They are roadmap directions, not automatically approved feature builds.

### NEXT — Opportunity Finder

**Goal:** Move beyond generic lead lists toward identifying businesses and customers showing meaningful opportunity signals.

Potential capabilities:
- Detect businesses showing buying/growth/problem signals.
- Identify businesses with weak online presence or obvious business gaps.
- Identify businesses that may need the user's product/service.
- Explain why each opportunity is relevant.
- Prioritize opportunities instead of dumping large lists.
- Generate an appropriate outreach message.
- Save opportunity → contact → follow up → convert.
- Connect with Lead Finder and Follow-Up Assistant.

**Principle:** The product should answer not only "Who is a business?" but "Why is this business worth contacting now?"

### NEXT — Business Strength / Health

**Goal:** Help businesses understand what is making them weak or strong in the eyes of potential customers and partners.

Potential dimensions:
- Discoverability
- Online presence
- Contactability
- Professional presentation
- Reviews/reputation
- Customer proof
- Website health
- Business information completeness
- Conversion readiness

Output should be actionable rather than merely a score:
- What is weak?
- Why does it matter?
- What should the business do next?
- Can AI Business help complete the action?

### LATER — Business Proof / Proof of Work

**Goal:** Help businesses demonstrate that they are real, capable, trustworthy, and worth choosing.

Potential assets:
- Business profile
- Portfolio
- Completed work
- Testimonials
- Reviews
- Customer proof
- Business information
- Credibility signals
- Public shareable business profile

Long-term direction: a business should be able to build a stronger public credibility footprint through AI Business.

### LATER — Opportunity / Idea Validation

**Goal:** Help businesses test demand before investing significant money or resources.

Potential capabilities:
- Validate an offer.
- Identify likely target customers.
- Research competing offers.
- Test willingness to pay.
- Identify objections.
- Suggest experiments.
- Turn validated demand into an acquisition workflow.

### LATER — Promotion & Distribution Opportunities

**Goal:** Help businesses discover legitimate places and channels where their target customers already exist.

Potential capabilities:
- Relevant communities.
- Industry channels.
- Content/distribution opportunities.
- Partnership opportunities.
- Promotion opportunities.
- Match opportunities to business type and target customer.

### PRODUCT PRINCIPLE — Connected Intelligence

These capabilities must not become isolated mini-tools.

AI Business should progressively connect:

**Business Profile**
→ **Business Health**
→ **Opportunity Discovery**
→ **Target Customer**
→ **Outreach**
→ **Follow-Up**
→ **Conversion**
→ **Payment**
→ **Proof of Work**
→ **Trust**
→ **More Opportunities**

The long-term advantage is the connected system and the business context accumulated across these workflows, not simply the number of tools.

### PRIORITIZATION RULE

Do not build every idea immediately.

Prioritize according to:
1. Evidence of real customer demand.
2. Ability to produce measurable business value.
3. Reuse of existing AI Business infrastructure.
4. Ability to strengthen the core growth loop.
5. Potential to increase retention or willingness to pay.

New ideas remain roadmap items until implemented and verified. Do not mark them DONE merely because they have been designed or discussed.



## VISION — Business Agent (unified AI assistant)
Goal: move from "collection of AI tools" to "one AI assistant that handles your customers." Not 10 separate agents — one connected system.
Architecture:
- Conversation layer: AI Receptionist, FAQs, business knowledge, intent understanding
- Qualification layer: ask qualifying questions, score opportunities, capture customer info
- Actions layer: book appointments, create customers, send follow-ups, create invoices
- Retention layer: intelligent follow-up, reminders, feedback collection, review requests
- Connected layer: WhatsApp + website + calendar + customers + invoices + payments + documents + business profile
Entry gate: do NOT start Phase 1 until Lead Finder 2.0 is fully shipped AND users visibly ask for conversational qualification. This stays VISION, never NOW.
Key principle: the AI reads → understands → decides → acts → records → follows up. That's the moat: connected business context + actions + data + workflows.


## VISION — Opportunity Finder (jobs first, staged)
Goal: help people find REAL opportunities and act on them with confidence. Jobs first; later grants, contracts, tenders, freelance.
Principles:
- Verify, don't expose: show "Identity verified" / "Business verified" badges. Never display NIN, BVN, or registration documents. Evidence stays internal.
- Two-sided trust: Employer Trust Score (registration, age, website, hiring history, job authenticity) meets Candidate Readiness (identity, CV, skills, experience, availability).
- Reuse existing engines: Search API = discovery; scoring = qualification; follow-up = relationship; booking system = interview scheduling; biz pages = employer profiles.
- First job source when V1 starts: AI Business businesses posting "we are hiring" on their own pages. External sources second.
Stages (do not skip ahead):
- V1: Search, normalize, dedupe, basic trust signals, simple match, apply. Businesses post jobs directly. Test if people want it.
- V2: Employer verification + candidate profile + application stages (interested, serious, qualified, employer review).
- V3: AI match with explanations (strong match because..., unlikely because...).
- V4: Interview scheduling, reminders, employer screening tools.
- V5: Verified hiring marketplace, only after real usage proves demand.
Entry gate: do NOT start V1 until Lead Finder 2.0 is fully shipped AND either revenue plateaus or users visibly ask for jobs. This stays VISION, never NOW.

---

## 🗺️ SESSION LOG — 2026-09-13 — SEARCH API SPRINT

### ✅ DONE (built & verified live tonight)
- [x] Proprietary Search API (Flask) — HasData is now optional fallback only
- [x] Deployed to 2 Render free replicas (failover pair)
- [x] 3 Overpass mirrors with auto-fallback (kumi.systems → private.coffee → overpass-api.de)
- [x] Supabase shared cloud DB (project: ai-business, table: public.businesses) — 50 Miami leads stored
- [x] Dedup + cleaning layer (proven: 5+ searches = still 50 rows, no duplicates)
- [x] gunicorn --timeout 240 worker fix on both services
- [x] UptimeRobot 5-min keep-alive pings on both URLs (no cold starts)
- [x] Frontend failover utility: lib/searchApi.js (searchBusinesses + getGhostLeads)
- [x] HANDOFF.md docs in BOTH repos (ai-business + ai-business-search-api)
- [x] Security model: zero keys in frontend/GitHub — secrets live only in Render env vars

### ⬜ TODO / NEEDS UPGRADE (next work items — unmarked = not done yet)
- [ ] **UI: Lead Finder results table** — wire to searchBusinesses(); red-highlight has_website=false rows
- [ ] **Opportunity Finder** — SELECT * FROM businesses WHERE has_website = false → lead list view
- [ ] **City accuracy fix** — namesake stragglers (Gold Coast/Australia rows) → add place="city" or bbox filter in app.py fetch_osm_business()
- [ ] **Hunter upgrade** — googlesearch blocked from cloud IPs (found_by_hunter always false) → swap to SERP API (~$5/mo e.g. ValueSERP) or DuckDuckGo
- [ ] **Usage limits** — daily/monthly quota table with auto-reset
- [ ] **Source aggregator** — add Yelp Fusion + Google Places ($200/mo free credit) as sources 2 & 3
- [ ] **Security: Supabase RLS** — businesses table currently RLS OFF → add policies / service-role-only key before production
- [ ] **3rd Render replica** — GitHub app reconnect loop unresolved; 2 replicas currently enough
- [ ] **Loading UX** — 30–90s response time needs skeleton/loading states in UI

### 🔑 KEY FACTS (read before touching anything)
- Backend repo: mrsmile-build/ai-business-search-api → READ ITS HANDOFF.md FIRST
- Live endpoints: POST https://ai-business-search-api.onrender.com/api/v1/search (and -2 variant)
- Health check: GET / must return "db":"supabase"
- Frontend util: lib/searchApi.js (URLs hardcoded, no env vars needed)
- Render start command (DO NOT CHANGE): gunicorn --timeout 240 --workers 1 app:app
- Supabase table: public.businesses (id, name, category, address, phone, website, has_website, found_by_hunter, created_at)

## AI Business Discoverability / AI Search Presence

**Status:** DONE

**Why:**
Make AI Business clearly understandable and discoverable by search engines and AI assistants through authoritative public product information, use-case pages, documentation, structured data, educational content, and proof.

**Implementation Plan:**
- [x] Audit current SEO and AI discoverability (Completed)
- [x] Priority 1: Technical Foundation (robots.txt, sitemap.xml, meta tags, JSON-LD, legal pages)
- [x] Priority 2: Core Product Pages (Dedicated HTML pages for each feature)
- [x] Priority 3: Use-Case & Problem-Solving Pages (Educational resources)
- [x] Priority 4: Documentation & Blog Section
- [x] Priority 5: AI Optimization (llms.txt, AI-crawler formatting)

**Rules:**
- Preserve existing working UI/features. Do not redesign the website unnecessarily.
- Every new page must contain genuinely useful information, not just SEO filler.
- Verify all technical implementations against official Google and Schema.org documentation.
