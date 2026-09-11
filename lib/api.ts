// Cassie Fit API client — talks to the Cloudflare Worker (D1-backed).
// Session token lives in localStorage under cassie_token.

const TOKEN_KEY = "cassie_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable — session just won't persist
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers: { ...headers, ...(options.headers as any) } });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON body
  }
  if (!res.ok) {
    throw new Error(data?.error || `Server error: ${res.status}`);
  }
  return data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export async function signup(email: string, password: string, name?: string): Promise<{ user: AuthUser; token: string }> {
  const data = await request<{ user: AuthUser; token: string }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const data = await request<{ user: AuthUser; token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function me(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const data = await request<{ user: AuthUser }>("/api/auth/me");
    return data.user;
  } catch {
    setToken(null);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore — clearing local token is what matters
  }
  setToken(null);
}

export interface SyncData {
  logs: any[];
  sessions: any[];
  memory: any | null;
  profile: any | null;
  plan_type: string;
}

export async function sync(): Promise<SyncData> {
  return request<SyncData>("/api/sync");
}

export async function saveProfile(data: unknown): Promise<void> {
  await request("/api/profile", { method: "PUT", body: JSON.stringify(data) });
}

export async function getPlan(): Promise<string> {
  const data = await request<{ plan_type: string }>("/api/profile/plan");
  return data.plan_type;
}

export async function saveMemory(data: unknown): Promise<void> {
  await request("/api/memory", { method: "PUT", body: JSON.stringify(data) });
}

export async function saveChatSession(session: { id: string } & Record<string, unknown>): Promise<void> {
  await request("/api/chat-session", { method: "PUT", body: JSON.stringify(session) });
}

export async function saveLog(log: { id: string } & Record<string, unknown>): Promise<void> {
  await request("/api/log", { method: "POST", body: JSON.stringify(log) });
}

export async function deleteLogs(ids: string[]): Promise<number> {
  const data = await request<{ deleted: number }>("/api/logs", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
  return data.deleted;
}
