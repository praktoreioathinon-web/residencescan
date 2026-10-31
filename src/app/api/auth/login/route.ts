import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  clearGuard, clearMemoryFailures, clientIp, findAuthUser, hasGuard, lockRemaining,
  memoryWait, noteMemoryFailure, recordFailure, tooManyAttempts,
} from "@/lib/login-guard";

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 1000) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const ip = clientIp(req);
  const wait = memoryWait(ip, email);
  if (wait > 0) return tooManyAttempts(wait);

  // A locked account is refused before the password is even checked, so a
  // correct guess during the lock doesn't get through.
  const account = await findAuthUser(email);
  if (account) {
    const locked = lockRemaining(account);
    if (locked > 0) return tooManyAttempts(locked);
  }

  const db = supabaseServer();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    noteMemoryFailure(ip, email);
    if (account) {
      const lockedNow = await recordFailure(account).catch(() => 0);
      if (lockedNow > 0) return tooManyAttempts(lockedNow);
    } else {
      const after = memoryWait(ip, email);
      if (after > 0) return tooManyAttempts(after);
    }
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // A correct password wipes the slate.
  clearMemoryFailures(email);
  if (account && hasGuard(account)) await clearGuard(account).catch(() => {});

  const { role, name } = data.user.app_metadata as { role?: string; name?: string };
  if (!role || !name) {
    return NextResponse.json({ error: "This account isn't fully set up yet." }, { status: 403 });
  }

  return NextResponse.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: { email: data.user.email, role, name },
  });
}
