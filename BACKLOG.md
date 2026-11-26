# AI BUSINESS BACKLOG — source of truth, 24 Nov 2026
Rule: nothing in NEXT or GATED gets built while NOW is open or paying customers = 0, except what a paying customer asks for.

## NOW — blocks money or safety
1. Expiry: downgrade to free when a trial passes trial_ends_at or last_payment_date > 31 days (getSubscription :469; :876 sets no end date; :3601 writes trial_ends_at, never read). Run SQL query 5 first; 7 days grace + message to current payers. [audit #1]
2. Email sender: verify ai-business.com.ng in Resend, send from hello@ai-business.com.ng via env var, log non-2xx (sendEmail :3930 uses onboarding@resend.dev). Test with a fresh Gmail. [audit #2]
3. Paystack webhook: charge.success verified with HMAC SHA512; user_id in payment metadata; use logged-in user's email in init (:822 trusts body email). [audit #3]
4. XSS remainder: esc() wherever dashboard prints leads/bookings (app.js :4303, :4030); wrap /demo/:slug stored text in escHtml (:4547-4588). Server-side strip of < > on anonymous posts DONE (e76c889). [audit #4]
5. Open doors: delete /api/debug/* (:4431,:4453) and /api/debug-backends (:4968); login on /api/welcome-email (:3935), /api/tts-voicerss and /api/voices (:4802,:4819); admin check on /api/admin/metrics (:4198); user id from token in /api/affiliate/track-signup (:3585). [audit #5]
6. Rate limiter: app.set('trust proxy',1), key on req.ip (:174 keys on spoofable X-Forwarded-For). [audit #6]
7. Pricing truth: one list everywhere (landing 9,000/22,500/67,500 at index.html:501-516 vs checkout 6,000/15,000/45,000 at :254); mark "Team access" coming soon or build it; drop "cancel anytime" until renewals exist. [audit #8]

## NEXT — sanctioned additions + measurement
8. Renewing billing: one monthly Paystack plan per tier; webhook updates subscriptions; day-25 reminder email; handle invoice.payment_failed. [audit add 1]
9. Daily digest email: "N customers went quiet, M follow-ups due, tap to send" from /api/attention (:283) + fixed sender. [audit add 3]
10. followup_sent event on every wa.me tap (15 links in dashboard); define activated = 1 saved lead + 1 sent follow-up within 7 days. [audit add 4]
11. Welcome/auth screen line: "Nothing connects to your accounts. It drafts, you send - on any channel." (tour step 1 has it; auth screen does not). [audit 5-min]
12. Landing page: pain headline; remove placeholder hero stats; make Start Free the loud button; fix 60-sec tour pill overlap; testimonials loading state. [audit landing]
13. Search Console + Bing Webmaster verification; submit sitemap; see which queries bring strangers before writing new guides. [visibility]
14. Lead Finder: name-guard at message assignment (message must start with its own lead's name, else safe template); accurate product description when sender is AI Business. [session]
15. AI cap: one useAI(req) helper before all Groq call sites (proposals, follow-up GET/POST, receptionist, widget chat, campaigns, demo data, website health, biz-ideas, break-story, coach). [audit #7]
16. Hosting: one vercel.json; rewrites for /demo/:slug and /a/:ref; one always-on Render instance (~$7) before any campaign. [audit #9]
17. Retire /api/admin/metrics whole-table read; use the five SQL queries instead. [audit #10]
18. Repo: git rm -r --cached node_modules; delete server.js.* backups; rewrite or delete HANDOFF.md. [audit #11]
19. Data law: product line — message about the business's own work, stop when asked; one hour with a Nigerian data-protection lawyer before ads. [audit law]
20. Founding 50: first 50 payers keep today's price 12 months + direct WhatsApp line. Ship only after items 1, 3, 7. [audit offer]

## GATED — after paying customers exist
21. Services marketplace phases 2-4: job requests, quotations, hiring, payments, commission, disputes, AI matching. Phase 1 directory LIVE at /services.html. [session]
22. Visibility Engine modules 2-6: Search Console integration, competitor intelligence, AI-citation monitoring, content calendar, conversion analytics. Module 1 LIVE (public check + pillar guide). [session]
23. Provider self-listing: opt-in flag on business pages auto-adding to providers.json (needs a column). Until then listings are added by hand. [session]
24. Native growth screen (growth.tsx) with in-app mission UI; WebView covers it today. [session]
25. Team mode, agents expansion, global pricing/currency, multi-language, HasData replacement. [audit gated]
26. Paid plans can hide the "Made with AI Business" footer (needs renewals first). [audit add 2]

## STANDING — weekly, not code
27. Friday numbers: signups, activated, paying, MRR, replies per 100 touches. If under a third of signups activate, fix onboarding before adding traffic.
28. Run the five Supabase queries monthly; your numbers replace all guesses by day 14 of any campaign.
29. Daily ~90 min: 10 useful comments where customers ask for clients (no link), 5 DMs to engagers offering a live search, 1 real screen recording (30-45s), message every new signup within a day and every silent signup on day 3.
30. Log outreach counts in the Growth Mission report nightly; tomorrow's mission comes from evidence, not mood.

## FROM THE NINE VIDEOS (24 Nov 2026)
31. Double-sided product-value referral, separate from cash affiliate: referrer AND friend each get +10 leads / +20 AI uses or a free Starter month. Customers won't take cash to recommend to a friend. [Wardell]
32. Commission guardrails: 12-month duration cap, negative commission on refund, documented 60-day cookie window. Test tracking against our own checkout before recruiting. [Vlasyev]
33. Output-quality log: score every AI draft next to the prompt and inputs that produced it; fix the prompt weekly. Started manually in a spreadsheet. [Henry]
34. Public changelog + "you asked, we built it" messages to everyone who requested a fix (Precious, Samuel, Daniel). [Burr]
35. Replace feature-pitch outreach with pain diagnosis: what is it costing you, what happens if unfixed for 6 months, what have you tried. Show at most three packages. Track new quality connections weekly. [Leese]
36. Content collaboration, zero cash: two guest appearances or lead-magnet swaps per month with audiences of freelancers and agencies. [Wardell]
37. GATED: hand-off button in the app that passes a job to a listed provider, with the platform taking a slice - all four partnership models in one. Needs payments + commission first. [Wardell's SEO-tool story]

## AFFILIATE PROGRAM SPECIFICS (26 Nov 2026)
38. Affiliate page as a sales page: headline "Earn N22,500 per Business sale (50% of first payment)" - lead with the highest tier, not the cheapest. Add commission table, cookie window, payout date, and the kit download. [Martell, Shopify]
39. Document and enforce a 90-day cookie window and pick first-touch or last-touch attribution. Currently undocumented. [Martell, Rewardful]
40. Earnings-per-click proof: once 3 conversions exist, publish real EPC and partner earnings screenshots. Until then show the honest offer, not invented numbers. [Martell]
41. Tiered commission: base rate, bump after 5 paying referrals, bump after 20. Rewards partners who keep going. [Shopify]
42. Post-checkout recruit prompt: after a successful payment, offer "earn 50% by referring a colleague" with their code pre-filled. Cheapest recruiting placement we own. [Shopify]
43. Fraud: lock /api/affiliate/track-signup to the token (audit #5), one trial per user, block self-referral, flag repeated codes from one IP. [Rewardful]
44. Partner onboarding sequence: 3 messages (day 0 kit + link, day 3 first-post template, day 7 check-in) plus a monthly note sharing what top partners did. Sales kit endpoint already exists. [Martell]
45. Growth stacking rule: once a channel produces signups, keep it running weekly before adding a new one. Never swap channels. [Martell]
46. Two or three free launch directories in week 3, only after renewals ship. Not now. [launch-platforms short]
