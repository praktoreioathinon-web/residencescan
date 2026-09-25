import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { Supplier } from "@/lib/data";

// Upsert (not insert) so a retry after a lost response is a harmless
// no-op instead of a duplicate-key error on the id primary key.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  if (user.role === "client") return forbidden();

  const supplier = await req.json() as Supplier;
  const db = supabaseServer();
  const { error } = await db.from("suppliers").upsert(supplier, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
