import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { Property } from "@/lib/data";
import { onlyIssueFieldsChanged } from "@/lib/property-guard";
import { merge3 } from "@/lib/merge";

const MAX_ATTEMPTS = 5;

// A property is one JSON document, and a save used to replace all of it with
// whatever the editing phone had loaded — so a phone holding an older copy
// wiped out other people's changes. Now every save says which version it was
// based on:
//   - same version as the server holds → nothing happened in between, write it.
//   - older version → merge the editor's change onto what the server holds now,
//     so both people's changes survive.
// The write itself is compare-and-swap on `rev`, so two saves landing at the
// same instant can't both win; the loser re-reads and merges again.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  if (!user) return unauthorized();

  let body: { base?: Property; next?: Property };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { base, next } = body;
  if (!next || typeof next !== "object" || !base || typeof base !== "object") {
    // An app tab opened before this update still sends the whole property
    // with no version to merge from — refuse rather than overwrite.
    return NextResponse.json({ error: "The app was updated — reload this page and try again." }, { status: 409 });
  }
  if (next.id !== params.id || !Array.isArray(next.rooms)) {
    return NextResponse.json({ error: "Invalid property." }, { status: 400 });
  }

  const db = supabaseServer();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: row, error: fetchErr } = await db.from("properties").select("data").eq("id", params.id).single();
    if (fetchErr || !row) return NextResponse.json({ error: "Property not found." }, { status: 404 });

    const current = row.data as Property;
    const currentRev = current.rev ?? 0;

    if (user.role === "client" && current.clientEmail !== user.email) return forbidden();

    // Nothing else was saved since the editor loaded it → their copy stands.
    // Otherwise lay their change on top of what's there now.
    const merged = ((base.rev ?? 0) === currentRev ? next : merge3(base, next, current)) as Property;
    merged.id = current.id;
    merged.rev = current.rev; // unset stays unset, so the client check below sees no difference

    // Two people each adding equipment would both write their own count.
    for (const room of merged.rooms) {
      if (Array.isArray(room.equipment)) room.equipmentCount = room.equipment.length;
    }

    // A client account may only report or clear an issue. Checked on the
    // merged result against what the server holds — never on client-supplied
    // copies — so a doctored `base` can't smuggle a change through.
    if (user.role === "client" && !onlyIssueFieldsChanged(current, merged)) return forbidden();

    merged.rev = currentRev + 1;

    let query = db.from("properties").update({ client_email: merged.clientEmail, data: merged }).eq("id", params.id);
    query = currentRev === 0
      ? query.or("data->>rev.is.null,data->>rev.eq.0")
      : query.eq("data->>rev", String(currentRev));
    const { data: updated, error } = await query.select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (updated && updated.length > 0) return NextResponse.json({ ok: true, property: merged });
    // Someone saved between our read and our write — go round again.
  }

  return NextResponse.json({ error: "Another change landed at the same moment — please try again." }, { status: 409 });
}
