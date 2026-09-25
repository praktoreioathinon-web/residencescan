import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const { email, password } = await req.json() as { email: string; password: string };
  const db = supabaseServer();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

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
