
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import crypto from 'crypto';
import { Groq } from 'groq-sdk';

// --- Configuration ---
const CONFIG = {
  RATE_LIMIT_WINDOW: 3600, // 1 hour
  RATE_LIMIT_MAX: 50,      // Max requests per IP per hour
  CACHE_TTL: 86400,        // 24 hours
  DEFAULT_COOLDOWN: 60,    // Default block time for 429s
  // Default configuration per user request
  DEFAULT_MODEL_CONFIG: {
    model: "groq/compound",
    compound_custom: {
      tools: {
        enabled_tools: [
          "web_search",
          "code_interpreter"
        ]
      }
    }
  }
};

// --- Redis Abstraction (Dual Mode) ---
interface UnifiedRedis {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string | null | 'OK'>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  exists(key: string): Promise<number>;
}

const getRedisClient = (): UnifiedRedis => {
  // 1. Priority: TCP (ioredis) - Best for performance/external hosting
  if (process.env.EXTERNAL_REDIS_URL) {
    console.log("Redis Status: Connected via TCP (IORedis)");
    const client = new IORedis(process.env.EXTERNAL_REDIS_URL);
    return {
      get: (key) => client.get(key),
      setex: (key, seconds, value) => client.set(key, value, 'EX', seconds),
      incr: (key) => client.incr(key),
      expire: (key, seconds) => client.expire(key, seconds),
      exists: (key) => client.exists(key),
    };
  }

  // 2. Fallback: HTTP (@upstash/redis) - Best for Vercel cold starts
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log("Redis Status: Connected via REST (Upstash)");
    const client = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return {
      get: async (key) => (await client.get(key)) as string | null,
      setex: async (key, seconds, value) => client.set(key, value, { ex: seconds }),
      incr: async (key) => client.incr(key),
      expire: async (key, seconds) => client.expire(key, seconds),
      exists: async (key) => client.exists(key),
    };
  }

  // Fallback for build time or missing config (prevents crash, but API will fail)
  console.warn("Redis Status: Not configured (No Caching/Rate Limiting)");
  return {
      get: async () => null,
      setex: async () => 'OK',
      incr: async () => 1,
      expire: async () => 1,
      exists: async () => 0
  };
};

const redis = getRedisClient();

// --- Helpers ---
const getIp = (req: VercelRequest) => {
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0] : 'unknown';
};

const hashBody = (body: any) => {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
};

// --- Core Engine: Smart Rotation & Execution ---
async function executeWithRotation(
  payload: any, 
  res: VercelResponse, 
  triedIndices: number[] = []
): Promise<void> {
  
  // 1. Load Keys
  const apiKeys = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) throw new Error('GROQ_API_KEYS not configured');

  // 2. Select Next Available Key
  let keyIndex = -1;
  for (let i = 0; i < apiKeys.length; i++) {
    if (triedIndices.includes(i)) continue;
    // Check Redis Blocklist
    const isBlocked = await redis.exists(`blocked_key:${i}`);
    if (!isBlocked) {
      keyIndex = i;
      break;
    }
  }

  if (keyIndex === -1) {
    throw new Error('Rate Limit: All API keys are currently exhausted or blocked.');
  }

  console.log(`Using Groq API Key Index: ${keyIndex}`);
  
  // Track individual key usage stats in Redis
  try {
    await redis.incr(`groq_key_usage:${keyIndex}`);
  } catch (e) {
    console.warn("Failed to log key usage to Redis", e);
  }

  const currentKey = apiKeys[keyIndex];
  const groq = new Groq({ apiKey: currentKey });

  try {
    // 3. Construct Request
    // We prioritize the incoming model (if vision/specific) over the default
    const modelToUse = payload.model || CONFIG.DEFAULT_MODEL_CONFIG.model;
    const isCompound = modelToUse === 'groq/compound';

    const requestOptions: any = {
      messages: payload.messages,
      model: modelToUse,
      temperature: payload.temperature ?? 1,
      max_completion_tokens: payload.max_completion_tokens ?? 1024,
      top_p: payload.top_p ?? 1,
      stream: payload.stream ?? false, // Default to false for easier client handling unless specified
      stop: payload.stop ?? null,
    };

    // Only add compound_custom if using the compound model
    if (isCompound) {
        requestOptions.compound_custom = payload.compound_custom || CONFIG.DEFAULT_MODEL_CONFIG.compound_custom;
    }

    if (requestOptions.stream) {
      // --- Streaming Handler ---
      const stream = await groq.chat.completions.create(requestOptions) as any;
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.end();
      return;

    } else {
      // --- Standard JSON Handler ---
      const completion = await groq.chat.completions.create(requestOptions);
      res.status(200).json(completion);
      return;
    }

  } catch (error: any) {
    console.error(`Key ${keyIndex} failed:`, error.message);

    // 4. Intelligent Error Handling (429)
    if (error.status === 429) {
      const retryHeader = error.headers?.['retry-after'];
      const cooldown = retryHeader ? parseInt(retryHeader, 10) : CONFIG.DEFAULT_COOLDOWN;
      
      console.warn(`Blocking key ${keyIndex} for ${cooldown}s (429 received)`);
      await redis.setex(`blocked_key:${keyIndex}`, cooldown, '1');

      // Recursive Retry
      return executeWithRotation(payload, res, [...triedIndices, keyIndex]);
    }

    throw error;
  }
}

// --- Main API Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const ip = getIp(req);

    // 1. Rate Limiting
    const rateKey = `rate_limit:${ip}`;
    const usage = await redis.incr(rateKey);
    if (usage === 1) await redis.expire(rateKey, CONFIG.RATE_LIMIT_WINDOW);
    
    if (usage > CONFIG.RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too Many Requests' });
    }

    // 2. Caching (Only for non-streaming requests to save tokens)
    const isStreaming = req.body.stream === true;
    if (!isStreaming) {
      const cacheKey = `groq_cache:${hashBody(req.body)}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cached));
      }
    }

    // 3. Execute
    await executeWithRotation(req.body, res);

  } catch (error: any) {
    const message = error.message || 'Internal Server Error';
    if (res.headersSent) {
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
}
