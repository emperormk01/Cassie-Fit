
// Groq Client - Proxied via Vercel Serverless Function
// We no longer expose the API Key here. It lives in env vars on the server.

// STRICT REQUIREMENT: Only use groq/compound. 
// Do NOT use meta-llama/llama-4-scout-17b-16e-instruct or openai/gpt-oss-120b.
const MODEL_ID = "groq/compound";

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url', text?: string, image_url?: { url: string } }>;
}

export const runGroqChat = async (messages: GroqMessage[], jsonMode: boolean = false) => {
  
  // Note: Even for vision requests, we now strictly route to the compound model
  // which handles tool/model delegation server-side if configured, or acts as the primary model.

  try {
    // 2. Call the Proxy
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages,
        model: MODEL_ID, // Strictly enforce groq/compound
        stream: false, // We use standard JSON response for the UI simplicity
        
        // Note: The proxy handles the 'compound_custom' tools injection automatically
        // when 'groq/compound' is used.
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AI Service Error (${response.status}): ${errorData?.error || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";

  } catch (error) {
    console.error("Groq Proxy Request Failed:", error);
    throw error;
  }
};
