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

### Appointment System Hardening (active)
Continuation of the verified booking lifecycle. Slices 1–4 are DONE (see DONE section).
5. Booking → customer/lead linkage; status transitions tracked for Analytics (current step). Plus micro-fix: reject same-day times already in the past at creation and reschedule.
3. Rescheduling and cancellation flows.
4. Reminders.
5. Booking → customer/lead linkage; status transitions tracked for Analytics.

---

## NEXT

### Lead Finder 2.0 / Signal System
FIND → UNDERSTAND → CONTACT → FOLLOW UP → CONVERT, built on honest signals (review count, new-listing framing, contact availability). No invented buying signals. Legal constraint: only sources with explicit programmatic access (HasData, public RSS); no scraping against robots.txt/ToS, no CAPTCHA bypass.

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
- **Appointment hardening slice 4 — 24h reminders (verified on localhost).** bookings.reminder_sent_at column; GET /api/bookings sweeps bookings starting within 24h (not cancelled, not yet reminded) and sends bell notification + owner email + customer email when present, then marks as reminded; reschedule resets the flag so moved bookings remind again; no daemon or cron (sweep runs on owner dashboard load); emails skip gracefully without RESEND_API_KEY. Verified: only within-24h bookings reminded (past and far-future skipped), no duplicate on repeat open, fresh reminder after reschedule. Schema: `booking_hours` jsonb + `blocked_dates` jsonb on `biz_pages` (null preserves legacy 08:00–18:00). Owner UI: per-day hours with closed toggle + break + unavailable-date chips, labeled columns, plain-English helpers, wipe-safe init. Customer UI: time dropdown dynamically generated from saved hours minus breaks and duration overrun; closed/blocked days show explicit messages. Server enforcement: blocked dates, closed days, open/close window, break intersection all reject with specific errors before the overlap check. Verified: exact Monday slot list (10/11/12/14/15 for 10:00–16:00 with 13:00–14:00 break), closed-day and blocked-date messages, chip persistence, success path with hours set.

---

## ROADMAP GOVERNANCE
1. Determine whether a new idea is already represented; if yes, refine the existing entry — never duplicate.
2. If genuinely new, add to the correct status section with the smallest useful version.
3. Build → test the real workflow → deploy → mark DONE with evidence → move on. One NOW item at a time.
4. DONE means the described scope shipped and was verified; it never closes the broader area to future improvement.
5. Preserve historical and architectural memory; consolidate, never erase.
