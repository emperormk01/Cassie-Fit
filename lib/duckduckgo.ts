
/**
 * Client-side implementation of DuckDuckGo Instant Answer API.
 * Uses a CORS proxy to function in browser environments.
 */

export interface DDQResponse {
  AbstractText: string;
  AbstractURL: string;
  Heading: string;
  RelatedTopics: { Text: string; FirstURL: string; Icon?: { URL: string } }[];
  Image?: string;
}

export async function searchDDG(query: string): Promise<string> {
  try {
    // 1. Setup Parameters similar to the Python script
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_html: '1',      // Remove HTML from result
      skip_disambig: '1' // Skip disambiguation pages
    });

    const targetUrl = `https://api.duckduckgo.com/?${params.toString()}`;
    
    // 2. Use CORS Proxy to allow browser request to DuckDuckGo
    // In production, this should be proxied by your own backend.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
        console.warn(`DDG Search failed: ${response.status}`);
        return "";
    }
    
    const data = await response.json();
    
    // 3. Extract relevant info (Porting logic from fetch_instant_answer & get_related_topics)
    let context = "";
    
    // Instant Answer (Abstract)
    if (data.AbstractText) {
        context += `[Instant Answer]: ${data.AbstractText}\n`;
    }
    
    // Related Topics (Limit to 5 to avoid token bloat)
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        context += "\n[Related Knowledge]:\n";
        
        let count = 0;
        for (const topic of data.RelatedTopics) {
            // Some topics are nested in 'Topics' array, simpler API usage focuses on direct Text
            if (topic.Text && count < 5) {
                context += `- ${topic.Text}\n`;
                count++;
            }
        }
    }

    if (!context) {
        // If no instant answer, standard chat logic will take over
        return "";
    }

    return `\nFACTUAL DATA FOUND FOR QUERY "${query}":\n${context}\n`;

  } catch (error) {
    console.error("Search Grounding Error:", error);
    return ""; // Fail gracefully so chat continues without search
  }
}
