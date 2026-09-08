
import { GoogleGenAI } from "@google/genai";

// 1. Retrieve keys injected by Vite
const getKeys = (): string[] => {
  try {
    // defined in vite.config.ts
    const pool = (process.env.API_KEYS_POOL as unknown) as string[];
    if (Array.isArray(pool) && pool.length > 0) return pool;
  } catch (e) {
    console.error("Failed to load API keys pool", e);
  }
  return [process.env.API_KEY || ''].filter(Boolean);
};

const keys = getKeys();
let currentKeyIndex = 0;

// 2. Client Factory
export const getGeminiClient = (): GoogleGenAI => {
  const key = keys[currentKeyIndex];
  if (!key) {
    console.error("CRITICAL: No API Keys available.");
    // Fallback to avoid crash, though it will likely fail 403
    return new GoogleGenAI({ apiKey: 'MISSING_KEY' });
  }
  return new GoogleGenAI({ apiKey: key });
};

// 3. Rotation Logic
export const rotateKey = () => {
  if (keys.length <= 1) return; // No point rotating if only 1 key
  
  const prevIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  console.warn(`[Gemini] Switching API Key: ${prevIndex} -> ${currentKeyIndex}`);
};

/**
 * Smart Rotation Wrapper:
 * Executes a Gemini operation with automatic failover to different API keys
 * ONLY if a specific Quota/Rate Limit error occurs.
 * 
 * @param operation Function that takes an AI instance and returns a promise
 * @param retries Max number of retries (defaults to number of keys available)
 */
export async function runWithRotation<T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  retries: number = keys.length
): Promise<T> {
  let lastError: any;
  
  // Attempt at least once, up to max retries or number of keys
  const attempts = Math.max(1, Math.min(retries, keys.length * 2)); 

  for (let i = 0; i < attempts; i++) {
    try {
      const ai = getGeminiClient();
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const msg = (error.message || error.toString()).toLowerCase();
      
      // Smart Rotation Conditions:
      // 429: Quota Exceeded / Rate Limit
      // 403: Forbidden (Key might be invalid or blocked)
      // 503: Service Unavailable (Temporary overload)
      const isRetryable = 
        msg.includes('429') || 
        msg.includes('403') || 
        msg.includes('503') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('resource_exhausted');

      // Do NOT rotate on legitimate errors (400 Bad Request, 404 Not Found, Safety Block)
      if (isRetryable && i < attempts - 1) {
        console.warn(`[Gemini] Request failed (Attempt ${i+1}/${attempts}). Error: ${msg}. Rotating key...`);
        rotateKey();
        continue;
      }
      
      // If it's not a quota/connection error, throw immediately.
      throw error;
    }
  }
  throw lastError;
}
