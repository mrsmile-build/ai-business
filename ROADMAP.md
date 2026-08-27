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
Multi-select business type is captured and saved correctly but powers zero personalization yet. — RESOLVED: dashboard already has a full NICHE_FEATURES rules engine in renderDashboard, covering all 8 business types with proper multi-niche dedup. Confirmed by reading the real code, not assumed.

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

### URGENT — single point of failure, only one backend remains — RESOLVED
Railway expired and was removed from failover. Only ai-business-1-ok3x.onrender.com remains. If this Render free trial also expires, the entire site goes offline with zero fallback. Need to either: add a second free backend back into rotation, or budget for Render's paid always-on tier once first paying customer covers it. Do not let this sit unaddressed.
Fix: re-added ai-business-1orz.onrender.com to the API_BACKENDS failover list in auth.js and dashboard/app.js. resolveBackend()/apiFetch() now have real redundancy. Residual, smaller gap: vercel.json's static /blog,/biz,/book rewrites still only point at ok3x - would need an Edge Function for failover there too.

### LATER — Voice Receptionist (3-phase: browser → WhatsApp → phone)
Phase 1 (browser "Talk to AI" button, speech-to-text/text-to-speech, no phone number) is genuinely buildable free - deserves its own dedicated session. Phase 2 (WhatsApp) and Phase 3 (Twilio-class telephony) duplicate already-logged blockers (Meta API access, paid telephony costs).

### LATER — Opportunity Feed (evolution of Lead Finder 2.0 idea)
Reframe from manual search to automatic daily feed. Most signals (funding, LinkedIn activity) still blocked per earlier entry. One real, free, buildable piece: Google News RSS feeds, no API key needed - could surface real news mentions (grand openings, expansions) as an honest signal, worth a small scoped build on its own rather than the full opportunity-score vision.

### Signal/Opportunity system - additional notes (consolidating repeated ideas)
Multiple sessions have proposed variations of the same core idea: reposition Lead Finder as a scored "Signal" system (FIND -> UNDERSTAND -> CONTACT -> FOLLOW UP -> CONVERT journey), showing WHY a business is worth contacting (poor reviews, new listing, weak web presence) rather than just a list. Same idea as earlier "Lead Finder 2.0" and "Opportunity Feed" entries - not new scope, just refined framing each time.
Real constraint that must guide any build here: do NOT scrape sites that prohibit it in their robots.txt/ToS, and do not attempt to bypass CAPTCHA/anti-bot/auth protections - this is a real legal exposure, not just a technical challenge. Stick to sources explicitly offering programmatic access (HasData, which is already paid/integrated, and public RSS feeds) rather than building a general-purpose scraper.
Genuinely buildable now with existing data: review-count-based signal (HasData already returns review count) - "8 reviews, low engagement" is a real, honest signal from data already being fetched, no new source needed. This is the smallest real next step if/when this gets built. — SHIPPED: added to Lead Finder results (commit 365b4be), <10 reviews shows "new listing, few reviews yet".

Note: automation-pattern document (Trigger -> AI analyzes -> score -> action -> follow-up) is a reframing of existing built features (enquiry handling, follow-up, appointments), not new scope. Its one actionable instruction - "build the strongest single end-to-end path first, don't build everything at once" - reinforces the existing Signal roadmap entry rather than adding to it.

### LATER — Vision 2 direction (Command Center, Business Memory, Sales Intelligence, Workflow Automation)
Multiple sessions converged on one throughline, not four separate ideas: Command Center (natural-language "what are you trying to accomplish" front door, routes to existing features via loadPage()-style logic), Business Memory (natural-language sales/expense/receivables tracking, explicitly NOT positioned as accountant-replacement), Sales Intelligence (help qualify/understand a lead, not just store it), Workflow Automation (n8n-inspired architecture, but ships ready-made business workflows rather than a general automation builder). All genuinely Vision 2 (business operating infrastructure) - explicitly deferred, not started.
Exception: Command Center Phase 1 (simple intent-to-existing-feature routing, zero new AI/backend needed) is near-term buildable, not long-term - worth its own scoped NEXT item whenever picked up, not buried with the rest.


---

# MASTER BUILD PRIORITY — 2026-08-27

This section defines the practical build order for the next major AI Business releases.
Existing DONE items above remain historical record. Do not remove them.

## CURRENT BUILD ORDER

### NOW — Activity & Performance System

Turn existing activity tracking into a useful business-performance layer.

Goals:
- Collect meaningful business actions already happening inside AI Business
- Show activity/performance indicators inside the hamburger menu
- Make indicators feel different from normal notifications
- Examples:
  - 5 businesses searched
  - 3 leads followed up
  - 4 messages sent
  - 2 new leads captured
  - 1 booking received
- Show useful counts/indicators beside relevant menu items
- Clicking the item opens a weekly performance view
- Show daily/weekly activity in a simple timeline
- Show progress and useful comparisons
- Generate plain-English AI insights from real activity data
- Suggest the next useful action
- Do not fabricate metrics
- Keep this separate from the existing general notification system

UX principle:
The menu should quietly communicate "you have something to look at" without confusing performance indicators with notifications.

---

### NEXT — Appointment / Booking System

Build booking into a complete business workflow.

Scope:
- Services
- Availability
- Booking form
- Customer booking
- Booking management
- Booking status
- Confirmation
- Reminders
- Business owner view
- AI-assisted booking
- Connect bookings to leads/customers
- Track booking activity for Analytics

Existing booking work is already shipped; this item means completing and strengthening the full workflow rather than rebuilding what already works.

---

### NEXT — Invoice & Receipt System

Scope:
- Create invoices
- Customer information
- Products/services
- Amounts
- Due dates
- Invoice status
- Send/share invoice
- Payment status
- Generate receipts
- Connect invoices to customers/leads
- Track financial activity

Do not position this as replacing an accountant.

---

### NEXT — Business Page Builder

Turn the existing public business-page capability into a stronger customer-facing page.

Scope:
- Business information
- Services/products
- Contact information
- WhatsApp/contact CTA
- Lead capture
- Booking
- Shareable business URL
- Better mobile experience
- Basic customization
- SEO-friendly public page

---

### NEXT — AI Workforce / AI Agents

Build AI assistance around real workflows rather than generic chatbots.

Initial modules:
- AI Receptionist
- Follow-Up Assistant
- Sales Assistant
- Social Assistant
- Reports/Analytics Assistant

Principle:
AI should assist with real business work and clearly show what requires human approval.

---

### NEXT — Lead Finder 2.0 / Signal System

Evolution of Lead Finder:

FIND → UNDERSTAND → CONTACT → FOLLOW UP → CONVERT

Build around honest signals from available data.

Initial buildable signals:
- Review count
- Low-review/new-listing framing
- Business information quality
- Contact availability
- Website/contact weaknesses where actually verified

Do not invent buying signals or business intelligence.

Future paid/restricted data sources may add:
- Hiring
- Funding
- LinkedIn activity
- Ad activity

---

### NEXT — Smart Analytics

Turn existing business data into decisions.

Scope:
- Leads
- Follow-ups
- Messages
- Bookings
- Conversions
- Revenue where available
- Weekly/monthly summaries
- Plain-English insights
- Trends
- Suggested actions

Example:
"Most of your enquiries this week came from WhatsApp."

Only use real stored data.

---

### NEXT — AI Business Command Center

Near-term phase of the larger Vision 2 direction.

Instead of forcing users to understand which feature they need, ask:

"What are you trying to accomplish?"

Examples:
- Get more customers
- Get more bookings
- Increase sales
- Follow up with customers
- Promote my business
- Organize my customers

AI Business should route the user into the appropriate existing workflow.

Phase 1:
Simple intent → existing feature/workflow routing.

Do not rebuild the entire platform for this.

---

### LATER — Multilingual AI Business

Allow users to select a preferred language and translate the application experience.

Scope:
- Menu
- Dashboard
- Buttons
- Forms
- Notifications
- Settings
- Onboarding
- AI responses

Architecture should use translation keys rather than hard-coded translations throughout the application.

---

### LATER — Business Memory

Remember useful customer/business context.

Examples:
- Customer preferences
- Important dates
- Payment promises
- Notes
- Follow-up context
- Previous interactions

Memory must be structured, explainable, and connected to actual customer records.

---

### LATER — AI Inbox

Different from the existing outbound Follow-Up Assistant.

Purpose:
- Receive inbound customer message
- AI understands message
- Draft response
- Human reviews/edits
- Human approves sending

Blocked until a reliable inbound messaging source is available.

---

### LATER — Voice Receptionist

Phase 1:
- Browser "Talk to AI"
- Speech-to-text
- AI response
- Text-to-speech

Phase 2:
- WhatsApp voice

Phase 3:
- Phone/telephony

Do not build paid telephony infrastructure before there is a business case.

---

### LATER — AI Meeting / Voice / OCR Assistant

Potential capabilities:
- Record meeting
- Transcribe
- Summarize
- Extract action items
- Create reminders
- Create quotations
- Voice commands
- OCR receipts
- OCR price lists
- OCR business cards

Large scope; defer until core product has stronger usage.

---

### LATER — Opportunity Feed

Evolution of Lead Finder.

Potential real/free source:
- Google News RSS
- Publicly available business/news signals

Future paid/restricted sources may add stronger signals.

Never fabricate opportunities.

---

### LATER — Industry-Specific Intelligence

Examples:
- Real estate → property matching
- Phone shop → phone recommendation
- Travel agency → package matching
- Hotel → room/package matching

Premium capability after real users and stronger onboarding.

---

### LATER — Advanced Vision 2

Long-term direction:
- Business Digital Twin
- Business Relationship Engine
- AI Business Scientist
- Risk Prediction
- AI CEO
- Cause-and-effect analysis
- Advanced experimentation
- Business Memory
- Sales Intelligence
- Workflow Automation

These are research-grade/large-scale ideas.

Do not allow the vision to delay shipping the core product.

---

## PRODUCT NORTH STAR

AI Business should evolve from:

"Here are a collection of business tools."

into:

"What are you trying to accomplish?"

Then AI Business should guide the user through the right workflow using the tools already available.

The product should help businesses:

1. Get more customers
2. Convert more leads into sales
3. Keep customers coming back
4. Save significant time
5. Make better business decisions

Standing filter:
If a feature does not materially help with at least one of these five outcomes, question whether it belongs in the product yet.

---

## BUILD RULE

Do not build everything simultaneously.

For each feature:
1. Define the smallest useful version
2. Build it
3. Test the real workflow
4. Fix actual bugs
5. Deploy
6. Mark it DONE
7. Move to the next priority

The roadmap is the source of truth for product direction.

---

## NEXT — Menu Activity Signals / Weekly Performance

Make the hamburger menu communicate useful business activity, not just navigation.

The menu should collect lightweight activity counts from existing product data and show small number badges beside relevant features, creating a "there is something here for me" feeling.

Examples:
- Analytics `2` → 2 useful performance insights available
- Leads `5` → 5 leads added/received recently
- Follow-Up `3` → 3 follow-ups due
- Messages `4` → 4 messages/actions recorded
- Bookings `2` → 2 upcoming/recent bookings
- Other existing tools can surface meaningful counts where appropriate

When the user opens Analytics, show a simple weekly performance view in plain language, for example:

- Found 5 businesses
- Added 3 leads
- Sent 4 messages
- Followed up with 3 prospects
- Won 1 customer
- Received 2 enquiries
- Had 2 bookings

Important distinction:
These activity badges are NOT the same as real notifications.

Notifications = events/messages that need attention.

Activity signals = evidence of what the business has been doing and what useful information is available inside each feature.

UX goal:
Make the menu feel alive and useful without creating fake urgency or meaningless numbers.

Build rule:
Use existing database/activity data where possible. Do not create a complicated analytics system first. Start with a small reliable weekly activity summary, test it, deploy it, then expand.

---

## NEXT — Command Center Phase 1

Evolve AI Business from a collection of tools toward:

"What are you trying to accomplish?"

Phase 1 should be simple and use existing features.

Examples:
- "I want more customers" → Lead Finder
- "I want to follow up with my leads" → Follow-Up
- "I want to get more bookings" → Booking
- "I want to promote my business" → appropriate promotion workflow
- "I want to see how my business is doing" → Analytics
- "I want to organize my customers" → Leads/Customers

No major new AI infrastructure required initially. The first version should route the user's intent to existing workflows.

---

## NEXT — Landing Page Outcome Positioning

Rewrite the homepage around business outcomes rather than a collection of features.

Core positioning:

"AI Business helps you get more customers, convert more leads, save time, keep customers coming back, and make better business decisions."

Requirements:
- 5-second clarity test
- Outcome-focused headline
- Before/After explanation
- One primary CTA repeated throughout the page
- Features should support the outcome story rather than lead it

---

## NEXT — Website Health Checker

Smallest useful version:
User enters a website URL.

Check for:
- Mobile-friendly viewport
- WhatsApp/contact option
- Clear CTA
- Booking/enquiry form
- Basic business information

Then AI produces a simple prioritized improvement report.

Must use real checks and must not invent results.

---

## NEXT — Smart Analytics

Use existing leads, bookings, enquiries, follow-ups and other activity data to generate plain-English business insights.

Examples:
- "You received most enquiries this week on Friday."
- "You added 8 leads but only followed up with 3."
- "Your follow-up activity increased compared with last week."

Start with deterministic calculations from real data. AI can explain the results, but it must not invent statistics.

---

## NEXT — Testimonials Collection

Add a simple way for existing users/customers to submit testimonials.

Requirements:
- Submission form
- Store testimonial
- Basic moderation/approval
- Approved testimonials can later appear on the landing page

---

## PRODUCT PRIORITY

Near-term priority order after the current profile/RLS fix:

1. Verify profile onboarding on the real frontend
2. Landing Page Rewrite
3. Menu Activity Signals / Weekly Performance
4. Smart Analytics
5. Command Center Phase 1
6. Website Health Checker
7. Testimonials Collection

Do not start multiple items simultaneously. Finish, test, deploy and mark each DONE before moving to the next priority.

