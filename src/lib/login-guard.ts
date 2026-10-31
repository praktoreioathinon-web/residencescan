import { supabaseServer } from "@/lib/supabase-server";

// Sign-in attempt limiting. Two layers:
//
// 1. Per account (persistent). After MAX_FAILURES wrong passwords within
//    WINDOW_MS the account is locked for LOCK_MS, whichever server instance or
//    IP the guesses came from. The counter lives on the account itself
//    (app_metadata.loginGuard), so it needs no extra database table.
// 2. Per IP and per email (in memory). Cheap and immediate, so floods are
//    stopped before they reach Supabase — whose own limit is per IP, and every
//    sign-in reaches it from our server, so one attacker could otherwise use
//    up the allowance for everybody. Serverless instances don't share memory,
//    so this layer is best effort; layer 1 is the one that always holds.
export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60_000;
export const LOCK_MS = 15 * 60_000;
const MAX_FAILURES_PER_IP = 20;

type Guard = { failures: number; first: number; lockedUntil?: number };
export type AuthUserLite = { id: string; app_metadata: Record<string, unknown> };

const memory = new Map<string, number[]>();

function recentFailures(key: string, now: number): number[] {
  const kept = (memory.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (kept.length) memory.set(key, kept);
  else memory.delete(key);
  return kept;
}

// Milliseconds the caller must wait, or 0 if they may try.
export function memoryWait(ip: string | null, email: string, now = Date.now()): number {
  const waits: number[] = [];
  const byEmail = recentFailures(`email:${email}`, now);
  if (byEmail.length >= MAX_FAILURES) waits.push(byEmail[byEmail.length - MAX_FAILURES] + WINDOW_MS - now);
  if (ip) {
    const byIp = recentFailures(`ip:${ip}`, now);
    if (byIp.length >= MAX_FAILURES_PER_IP) waits.push(byIp[byIp.length - MAX_FAILURES_PER_IP] + WINDOW_MS - now);
  }
  return waits.length ? Math.max(...waits) : 0;
}

export function noteMemoryFailure(ip: string | null, email: string, now = Date.now()) {
  for (const key of [`email:${email}`, ...(ip ? [`ip:${ip}`] : [])]) {
    memory.set(key, [...recentFailures(key, now), now]);
  }
}

export function clearMemoryFailures(email: string) {
  memory.delete(`email:${email}`);
}

export function clientIp(req: Request): string | null {
  const ip =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip");
  return ip?.trim() || null;
}

// Finds an account by exact email. Supabase's admin API has no get-by-email,
// but its list endpoint takes a substring filter; match exactly afterwards.
export async function findAuthUser(email: string): Promise<AuthUserLite | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&per_page=10`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { users } = (await res.json()) as { users?: { id: string; email?: string; app_metadata?: Record<string, unknown> }[] };
    const user = users?.find((u) => u.email?.toLowerCase() === email);
    return user ? { id: user.id, app_metadata: user.app_metadata ?? {} } : null;
  } catch {
    return null; // a lookup problem must never stop everyone signing in
  }
}

function readGuard(user: AuthUserLite): Guard | null {
  const g = user.app_metadata.loginGuard as Guard | null | undefined;
  return g && typeof g.failures === "number" && typeof g.first === "number" ? g : null;
}

// Milliseconds left on an account lock, or 0.
export function lockRemaining(user: AuthUserLite, now = Date.now()): number {
  const until = readGuard(user)?.lockedUntil ?? 0;
  return until > now ? until - now : 0;
}

export function hasGuard(user: AuthUserLite): boolean {
  return readGuard(user) !== null;
}

// Counts a wrong password against the account. Returns the lock length in ms
// if this failure tipped it over the limit, otherwise 0.
export async function recordFailure(user: AuthUserLite, now = Date.now()): Promise<number> {
  const previous = readGuard(user);
  const current = previous && now - previous.first < WINDOW_MS ? previous : null;
  const failures = (current?.failures ?? 0) + 1;
  const guard: Guard = { failures, first: current?.first ?? now };
  if (failures >= MAX_FAILURES) guard.lockedUntil = now + LOCK_MS;

  // Always rebuild from the account's own metadata so role and name survive.
  await supabaseServer().auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, loginGuard: guard } });
  return guard.lockedUntil ? LOCK_MS : 0;
}

export async function clearGuard(user: AuthUserLite) {
  await supabaseServer().auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, loginGuard: null } });
}

export function tooManyAttempts(waitMs: number) {
  const minutes = Math.max(1, Math.ceil(waitMs / 60_000));
  return Response.json(
    { error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    { status: 429, headers: { "Retry-After": String(Math.ceil(waitMs / 1000)) } }
  );
}
