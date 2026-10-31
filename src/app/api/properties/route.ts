import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { Property } from "@/lib/data";

// The client generates the id and sends the full property. A retry after a
// lost response (the write actually landed, only the confirmation didn't)
// re-sends the identical row; ignoring duplicates makes that a no-op instead
// of an error — and, unlike a plain upsert, it can't overwrite edits made to
// the property in the meantime.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  if (user.role === "client") return forbidden();

  const property = await req.json() as Property;
  const db = supabaseServer();
  const { error } = await db
    .from("properties")
    .upsert({ id: property.id, client_email: property.clientEmail, data: property }, { onConflict: "id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
