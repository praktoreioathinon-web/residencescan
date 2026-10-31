import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { Property } from "@/lib/data";
import { onlyIssueFieldsChanged } from "@/lib/property-guard";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  if (!user) return unauthorized();

  const next = await req.json() as Property;
  const db = supabaseServer();

  if (user.role === "client") {
    const { data: row, error: fetchErr } = await db.from("properties").select("data").eq("id", params.id).single();
    if (fetchErr || !row) return NextResponse.json({ error: "Property not found." }, { status: 404 });
    const existing = row.data as Property;
    if (existing.clientEmail !== user.email) return forbidden();
    if (!onlyIssueFieldsChanged(existing, next)) return forbidden();
  }

  const { error } = await db
    .from("properties")
    .update({ client_email: next.clientEmail, data: next })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
