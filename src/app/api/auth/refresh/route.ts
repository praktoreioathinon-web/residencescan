import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Access tokens are short-lived; the client calls this with its stored
// refresh token when a request comes back 401, instead of forcing a
// re-login every hour.
export async function POST(req: Request) {
  const { refreshToken } = await req.json() as { refreshToken: string };
  const db = supabaseServer();
  const { data, error } = await db.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
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
