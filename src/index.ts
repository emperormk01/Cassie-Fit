// Cassie Fit Cloudflare Worker entry.
//
// Serves the Vite SPA from ./dist (Workers Static Assets) and handles:
// - POST /api/proxy (Groq chat proxy, groq/compound enforced, key rotation)
// - /api/auth/* (email+password auth, PBKDF2-SHA256, D1 sessions)
// - /api/sync, /api/profile*, /api/memory, /api/chat-session, /api/log*,
//   /api/logs (owner-scoped app data on D1, replaces Supabase)

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}
interface D1Result<T = any> {
  results?: T[];
}
interface D1Meta {
  changes?: number;
}
interface D1Response {
  meta: D1Meta;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Response>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  GROQ_API_KEY?: string;
  GROQ_API_KEYS?: string;
  ENVIRONMENT?: string;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GROQ_MODEL = "groq/compound";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function unhex(s: string): Uint8Array {
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: unhex(saltHex), iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return hex(new Uint8Array(bits));
}

function bearerToken(req: Request): string | null {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

async function authUser(req: Request, db: D1Database): Promise<UserRow | null> {
  const token = bearerToken(req);
  if (!token) return null;
  const now = new Date().toISOString();
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.created_at FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .bind(token, now)
    .first<UserRow>();
  return row ?? null;
}

async function createSession(db: D1Database, userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_MS);
  await db
    .prepare(`INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`)
    .bind(token, userId, now.toISOString(), expires.toISOString())
    .run();
  return token;
}

function publicUser(u: UserRow): { id: string; email: string; name: string | null } {
  return { id: u.id, email: u.email, name: u.name };
}

function parseJson(row: any, key: string): any {
  if (!row || !row[key]) return null;
  try {
    return JSON.parse(row[key] as string);
  } catch {
    return null;
  }
}

async function handleSignup(req: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "").trim().slice(0, 120) || null;

  if (!EMAIL_RE.test(email)) return json({ error: "Enter a valid email address" }, 400);
  if (password.length < 10) return json({ error: "Password must be at least 10 characters long" }, 400);

  const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
  if (existing) return json({ error: "Email already registered — try signing in instead" }, 400);

  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const passwordHash = await hashPassword(password, salt);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, salt, name, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, email, passwordHash, salt, name, now)
    .run();

  const token = await createSession(env.DB, id);
  return json({ user: { id, email, name }, token }, 201);
}

async function handleLogin(req: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return json({ error: "Email and password are required" }, 400);

  const row = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first<any>();
  if (!row) return json({ error: "No account found for this email" }, 401);
  const attempt = await hashPassword(password, row.salt as string);
  if (attempt !== row.password_hash) return json({ error: "Incorrect password" }, 401);

  const token = await createSession(env.DB, row.id as string);
  return json({ user: publicUser(row as unknown as UserRow), token });
}

// One round trip replacing loadSupabaseData + profile fetch.
async function handleSync(env: Env, userId: string): Promise<Response> {
  const [logsRes, sessRes, memRow, profRow] = await Promise.all([
    env.DB.prepare(`SELECT data FROM daily_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`)
      .bind(userId)
      .all<any>(),
    env.DB.prepare(`SELECT data FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`)
      .bind(userId)
      .all<any>(),
    env.DB.prepare(`SELECT data FROM user_memory WHERE user_id = ?`).bind(userId).first<any>(),
    env.DB.prepare(`SELECT data, plan_type FROM profiles WHERE user_id = ?`).bind(userId).first<any>(),
  ]);
  const parseAll = (rows: any[] | undefined) => {
    const out: any[] = [];
    for (const r of rows || []) {
      try {
        out.push(JSON.parse(r.data as string));
      } catch {
        // skip corrupt rows
      }
    }
    return out;
  };
  return json({
    logs: parseAll(logsRes.results),
    sessions: parseAll(sessRes.results),
    memory: parseJson(memRow, "data"),
    profile: parseJson(profRow, "data"),
    plan_type: (profRow?.plan_type as string) ?? "free",
  });
}

// Groq chat proxy. Model pinned to groq/compound; keys rotate.
async function handleProxy(req: Request, env: Env): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const rawKeys = env.GROQ_API_KEYS || env.GROQ_API_KEY || "";
  const keyPool = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
  if (keyPool.length === 0) {
    return json({ error: "AI service not configured" }, 500);
  }

  const payload: any = {
    messages: body.messages,
    model: GROQ_MODEL,
    temperature: body.temperature ?? 1,
    max_completion_tokens: body.max_completion_tokens ?? 1024,
    top_p: body.top_p ?? 1,
    stream: body.stream ?? false,
    compound_custom: {
      tools: { enabled_tools: ["web_search", "code_interpreter"] },
    },
  };

  let lastError = "AI request failed";
  for (const apiKey of keyPool) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        if (payload.stream) {
          return new Response(response.body, {
            status: 200,
            headers: {
              ...corsHeaders(),
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }
        const data = await response.json();
        return json(data);
      }
      const errorText = await response.text();
      console.warn(`[Groq] key failed (${response.status}): ${errorText.substring(0, 100)}`);
      lastError = `AI service error ${response.status}`;
      if (response.status === 400 || response.status === 401) break;
    } catch (err: any) {
      console.error("[Groq] fetch error:", err);
      lastError = err.message;
    }
  }
  return json({ error: lastError }, 500);
}

async function authed(req: Request, env: Env): Promise<{ user: UserRow } | Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  const user = await authUser(req, env.DB);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return { user };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return new Response(JSON.stringify({ name: "CassieFit", status: "online" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/proxy") {
      return handleProxy(request, env);
    }

    if (path === "/api/auth/signup" && request.method === "POST") {
      return handleSignup(request, env);
    }

    if (path === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env);
    }

    if (path === "/api/auth/me" && request.method === "GET") {
      const user = await authUser(request, env.DB);
      if (!user) return json({ error: "Unauthorized" }, 401);
      return json({ user: publicUser(user) });
    }

    if (path === "/api/auth/logout" && request.method === "POST") {
      const token = bearerToken(request);
      if (token) {
        await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
      }
      return json({ loggedOut: true });
    }

    if (path === "/api/sync" && request.method === "GET") {
      const a = await authed(request, env);
      if (a instanceof Response) return a;
      return handleSync(env, a.user.id);
    }

    if (path === "/api/profile" && request.method === "PUT") {
      const a = await authed(request, env);
      if (a instanceof Response) return a;
      let body: any;
      try {
        body = await req_json(request);
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
      )
        .bind(a.user.id, JSON.stringify(body), now)
        .run();
      return json({ saved: true });
    }

    if (path === "/api/profile/plan" && request.method === "GET") {
      const a = await authed(request, env);
      if (a instanceof Response) return a;
      const row = await env.DB.prepare(`SELECT plan_type FROM profiles WHERE user_id = ?`)
        .bind(a.user.id)
        .first<any>();
      return json({ plan_type: (row?.plan_type as string) ?? "free" });
    }

    if (path === "/api/memory" && request.method === "PUT") {
      const a = await authed(request, env);
      if (a instanceof Response) return a;
      let body: any;
      try {
        body = await req_json(request);
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO user_memory (user_id, data, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
      )
        .bind(a.user.id, JSON.stringify(body), now)
        .run();
      return json({ saved: true });
    }

    if (path === "/api/chat-session" && request.method === "PUT") {
      const a = await authed(request, env);
      if (a instanceof Response) return a;
      let body: any;
      try {
        body = await req_json(request);
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (!body.id) return json({ error: "Session id required" }, 400);
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO chat_sessions (id, user_id, data, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
      )
        .bind(String(body.id), a.user.id, JSON.stringify(body), now)
        .run();
      return json({ saved: true });
    }

    if (path === "/api/log" && request.method === "POST") {
      const a = await authed(request, env);
      if (a instanceof Response) return a;
      let body: any;
      try {
        body = await req_json(request);
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (!body.id) return json({ error: "Log id required" }, 400);
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT OR IGNORE INTO daily_logs (id, user_id, data, created_at) VALUES (?, ?, ?, ?)`
      )
        .bind(String(body.id), a.user.id, JSON.stringify(body), body.created_at || now)
        .run();
      return json({ saved: true }, 201);
    }

    if (path === "/api/logs" && request.method === "DELETE") {
      const a = await authed(request, env);
      if (a instanceof Response) return a;
      let body: any;
      try {
        body = await req_json(request);
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
      if (ids.length === 0) return json({ deleted: 0 });
      const placeholders = ids.map(() => "?").join(",");
      const res = await env.DB.prepare(
        `DELETE FROM daily_logs WHERE user_id = ? AND id IN (${placeholders})`
      )
        .bind(a.user.id, ...ids)
        .run();
      return json({ deleted: res.meta.changes ?? 0 });
    }

    return env.ASSETS.fetch(request);
  },
};

async function req_json(request: Request): Promise<any> {
  return request.json();
}
