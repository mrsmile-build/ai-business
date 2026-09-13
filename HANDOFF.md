# AI Business Frontend — Handoff

## STATUS: MVP LIVE ✅
Vercel URL: https://ai-business-two-psi.vercel.app/

## Architecture
- **Framework**: Next.js on Vercel
- **Backend**: 2 Render replicas (see `mrsmile-build/ai-business-search-api`)
- **DB**: Supabase "ai-business" project, `public.businesses` table

## Key files
- `lib/searchApi.js` — failover utility (hardcoded Render URLs, no env vars)
  - `searchBusinesses(category, city)` → `{data, source}`
  - `getGhostLeads(result)` → array of `has_website=false` businesses

## Usage pattern
\`\`\`js
import { searchBusinesses, getGhostLeads } from "./lib/searchApi";

const result = await searchBusinesses("restaurant", "Miami");
if (result.data.length > 0) {
  // Render leads, highlight ghost leads in red
  const opportunities = getGhostLeads(result);
}
\`\`\`

## Tomorrow's UI work
1. Search input form → calls `searchBusinesses()`
2. Results table with columns: name, address, phone, website, has_website
3. Red highlight on `has_website=false` rows (Opportunity Finder leads)
4. "Find leads in [city]" button that triggers the search
5. Loading states for the 30-90s response time
