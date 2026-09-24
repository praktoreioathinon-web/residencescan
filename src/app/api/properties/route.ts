import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Property } from "@/lib/data";

// The client generates the id and sends the full property, and this upserts
// rather than plain-inserts: a retry after a lost response (the write
// actually landed, only the confirmation didn't) re-sends the identical row
// and is a harmless no-op instead of a duplicate-key error.
export async function POST(req: Request) {
  const property = await req.json() as Property;
  const db = supabaseServer();
  const { error } = await db
    .from("properties")
    .upsert({ id: property.id, client_email: property.clientEmail, data: property }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
