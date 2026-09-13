# lib/searchApi.js

Proprietary failover utility for AI Business Search API.

## Usage
\`\`\`js
import { searchBusinesses, getGhostLeads } from "./lib/searchApi";

const result = await searchBusinesses("restaurant", "Miami");
const ghostLeads = getGhostLeads(result); // high-value no-website leads
\`\`\`

## Architecture
- No env vars needed (URLs hardcoded, they are public)
- No keys exposed (all keys live on Render backend only)
- Auto-failover between 2 Render replicas sharing one Supabase brain
