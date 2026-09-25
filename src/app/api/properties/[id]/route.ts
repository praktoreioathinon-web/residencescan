import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { Property } from "@/lib/data";

// A client account may only report or clear an issue on equipment in a
// property they actually own — nothing else about the property (rooms,
// equipment, photos, maintenance history, who it's assigned to) may change
// in the same request. Everything else here is compared field-by-field
// rather than trusted, since the whole point of this check is to not just
// take the client's word for what changed.
function onlyIssueFieldsChanged(existing: Property, next: Property): boolean {
  if (
    existing.id !== next.id || existing.name !== next.name || existing.area !== next.area ||
    existing.location !== next.location || existing.clientEmail !== next.clientEmail ||
    existing.updated !== next.updated || existing.photoUrl !== next.photoUrl ||
    !!existing.archived !== !!next.archived || existing.rooms.length !== next.rooms.length ||
    JSON.stringify(existing.maintenanceLog) !== JSON.stringify(next.maintenanceLog)
  ) return false;

  for (let i = 0; i < existing.rooms.length; i++) {
    const er = existing.rooms[i], nr = next.rooms[i];
    if (
      er.id !== nr.id || er.name !== nr.name || er.category !== nr.category ||
      er.subtitle !== nr.subtitle || er.equipmentCount !== nr.equipmentCount ||
      er.photoUrl !== nr.photoUrl || er.equipment.length !== nr.equipment.length
    ) return false;

    for (let j = 0; j < er.equipment.length; j++) {
      const ee = er.equipment[j], ne = nr.equipment[j];
      if (ee.name !== ne.name || ee.model !== ne.model || ee.status !== ne.status || ee.photoUrl !== ne.photoUrl) return false;
      // issueNote / issueReportedAt are the only fields allowed to differ.
    }
  }
  return true;
}

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
