/**
 * AI Business Search API - Failover Utility
 * 
 * Architecture:
 * - Frontend calls public Render API URLs (no keys exposed)
 * - Backend (Render) handles Supabase with its own env vars
 * - Tries API 1, then API 2, then returns empty (frontend can fallback to HasData)
 */

const API_URLS = [
  "https://ai-business-search-api.onrender.com/api/v1/search",
  "https://ai-business-search-api-2.onrender.com/api/v1/search",
];

export async function searchBusinesses(category, city) {
  const payload = JSON.stringify({ category, city });
  const headers = { "Content-Type": "application/json" };

  for (let i = 0; i < API_URLS.length; i++) {
    try {
      console.log(`🚀 Trying Search API ${i + 1}...`);
      const res = await fetch(API_URLS[i], {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(90000), // 90s to allow cold starts
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✅ API ${i + 1} success: ${data.length} results`);
        return { data, source: `custom_api_${i + 1}` };
      }
      console.warn(`⚠️ API ${i + 1} returned ${res.status}, trying next...`);
    } catch (e) {
      console.warn(`⚠️ API ${i + 1} failed: ${e.message}`);
    }
  }

  console.error("❌ All custom APIs failed. Frontend should fallback to HasData.");
  return { data: [], source: "failed" };
}

/**
 * Helper: extract Opportunity Finder leads (no website)
 */
export function getGhostLeads(searchResult) {
  if (!searchResult?.data) return [];
  return searchResult.data.filter((b) => b.has_website === false);
}
