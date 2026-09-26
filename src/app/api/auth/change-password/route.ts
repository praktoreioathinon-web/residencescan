import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized } from "@/lib/auth-server";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();

  const { password } = await req.json() as { password: string };
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const db = supabaseServer();
  const { error } = await db.auth.admin.updateUserById(user.id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
