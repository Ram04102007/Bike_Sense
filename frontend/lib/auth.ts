/**
 * BikeSense Auth Layer
 * ─────────────────────────────────────────────────────────────
 * Professional session-based auth without external dependencies.
 * Pattern used by Ola, Rapido, and most Indian B2C startups.
 *
 * Flow:
 *   Sign-up  →  store { user, role, token } in localStorage
 *   Sign-in  →  validate credentials, restore session
 *   Route guard →  redirect unauthenticated users
 *   Sign-out → clear session, redirect to /auth/login
 */

export type Role = "admin" | "consumer";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Session {
  user: AuthUser;
  token: string;       // opaque session token
  expiresAt: number;   // unix ms
}

const SESSION_KEY = "bikesense_session";
const USERS_KEY = "bikesense_users";

// ── Token helpers ─────────────────────────────────────────────
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── User store (localStorage as mock DB) ──────────────────────
function getUsers(): Record<string, AuthUser & { passwordHash: string }> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, AuthUser & { passwordHash: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Pure-JS fallback hash — works even on non-secure HTTP origins (e.g. LAN IP)
// where crypto.subtle is blocked by the browser.
function _fallbackHash(str: string): string {
  const salted = str + "bikesense_salt_2024";
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(14, "0");
}

// SHA-256 when available (secure context), fallback otherwise
async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const encoder = new TextEncoder();
      const data    = encoder.encode(password + "bikesense_salt_2024");
      const hash    = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch { /* fall through */ }
  // Non-secure context (HTTP on LAN IP) — use pure-JS hash
  return _fallbackHash(password);
}

// ── Public API ────────────────────────────────────────────────

export async function signUp(params: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}): Promise<{ success: true; session: Session } | { success: false; error: string }> {
  const users = getUsers();
  const existing = Object.values(users).find(u => u.email === params.email);
  if (existing) return { success: false, error: "An account with this email already exists." };
  if (params.password.length < 8)
    return { success: false, error: "Password must be at least 8 characters." };

  const passwordHash = await hashPassword(params.password);
  const user: AuthUser = {
    id: generateId(),
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    role: params.role,
    createdAt: new Date().toISOString(),
  };

  users[user.id] = { ...user, passwordHash };
  saveUsers(users);
  const session = createSession(user);
  return { success: true, session };
}

export async function signIn(params: {
  email: string;
  password: string;
}): Promise<{ success: true; session: Session } | { success: false; error: string }> {
  const users = getUsers();
  const record = Object.values(users).find(u => u.email === params.email);
  if (!record) return { success: false, error: "No account found with this email." };

  const passwordHash = await hashPassword(params.password);
  if (record.passwordHash !== passwordHash)
    return { success: false, error: "Incorrect password. Please try again." };

  const { passwordHash: _, ...user } = record;
  const session = createSession(user);
  return { success: true, session };
}

function createSession(user: AuthUser): Session {
  const session: Session = {
    user,
    token: generateToken(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Fire-and-forget: register user on the backend server registry
  // so developers can see all users via GET /api/v1/auth/users
  fetch("/api/ml/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }),
  }).catch(() => {/* best-effort — don't crash if backend is down */ });

  return session;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function requireRole(role: Role): boolean {
  return getUser()?.role === role;
}
