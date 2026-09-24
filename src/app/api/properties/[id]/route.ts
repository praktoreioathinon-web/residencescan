import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Property } from "@/lib/data";

// The client computes the full updated Property object (same reducer logic
// it always has) and sends it here to overwrite that row — one endpoint
// covers every mutation (add room, add equipment, report an issue, change
// client, upload a photo, log maintenance, ...) instead of one per action.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const property = await req.json() as Property;
  const db = supabaseServer();
  const { error } = await db
    .from("properties")
    .update({ client_email: property.clientEmail, data: property })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
