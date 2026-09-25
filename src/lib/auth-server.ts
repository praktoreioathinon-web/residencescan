import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { Role } from "@/lib/data";

export type AuthedUser = { id: string; email: string; role: Role; name: string };

// Verifies the bearer token every API route receives against Supabase Auth
// and returns who's actually calling — this is the check that was missing
// everywhere before: every route trusted whatever the client claimed about
// itself, so anyone who found the API's shape (no login needed) could read
// or write any client's data directly.
export async function requireUser(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const db = supabaseServer();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;

  const role = data.user.app_metadata?.role as Role | undefined;
  const name = data.user.app_metadata?.name as string | undefined;
  if (!role || !name || !data.user.email) return null;

  return { id: data.user.id, email: data.user.email, role, name };
}

export function unauthorized() {
  return NextResponse.json({ error: "Sign in required." }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Not allowed for this account." }, { status: 403 });
}
