import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { ClientRecord } from "@/lib/data";

// Upsert (not insert) so a retry after a lost response is a harmless
// no-op instead of a duplicate-key error on the email primary key.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  if (user.role === "client") return forbidden();

  const client = await req.json() as ClientRecord;
  const db = supabaseServer();
  const { error } = await db.from("clients").upsert(client, { onConflict: "email" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
