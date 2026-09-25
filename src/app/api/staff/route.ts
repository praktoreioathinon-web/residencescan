import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// Lists the real admin/support accounts from Supabase Auth — the
// authoritative source now that logins are real, instead of a separate
// hardcoded array that could silently drift from who can actually sign in.
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const db = supabaseServer();
  const { data, error } = await db.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const staff = data.users
    .filter((u) => u.app_metadata?.role === "admin" || u.app_metadata?.role === "support")
    .map((u) => ({ email: u.email, name: u.app_metadata.name as string, role: u.app_metadata.role as string }));

  return NextResponse.json({ staff });
}
