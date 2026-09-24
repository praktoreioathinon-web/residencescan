import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { SEED_PROPERTIES, SEED_CLIENTS, SEED_SUPPLIERS } from "@/lib/data";

// This reads live data (and needs env vars only present at runtime), so it
// must never be statically prerendered at build time or cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Loads everything the app needs on boot. The first time this runs against an
// empty database it seeds the starting demo data — after that, every read
// comes straight from Postgres instead of a browser's localStorage.
//
// Seeding uses upsert-and-ignore-duplicates rather than a plain insert guarded
// by an "is this table empty" check: that check is a race (two people loading
// the app at once, or a read landing right after the tables were created) and
// a plain insert would 500 on a duplicate key if it ever fired twice. Upsert
// makes seeding idempotent — safe to attempt on every request that finds
// nothing yet, and a harmless no-op once the data already exists.
export async function GET() {
  const db = supabaseServer();

  const { data: existingClients, error: clientsErr } = await db.from("clients").select("email").limit(1);
  if (clientsErr) return NextResponse.json({ error: clientsErr.message }, { status: 500 });

  if (!existingClients || existingClients.length === 0) {
    const { error: seedClientsErr } = await db.from("clients").upsert(SEED_CLIENTS, { onConflict: "email", ignoreDuplicates: true });
    if (seedClientsErr) return NextResponse.json({ error: seedClientsErr.message }, { status: 500 });
    const { error: seedSuppliersErr } = await db.from("suppliers").upsert(SEED_SUPPLIERS, { onConflict: "id", ignoreDuplicates: true });
    if (seedSuppliersErr) return NextResponse.json({ error: seedSuppliersErr.message }, { status: 500 });
    const { error: seedPropertiesErr } = await db.from("properties").upsert(
      SEED_PROPERTIES.map((p) => ({ id: p.id, client_email: p.clientEmail, data: p })),
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (seedPropertiesErr) return NextResponse.json({ error: seedPropertiesErr.message }, { status: 500 });
  }

  const [{ data: clients, error: clientsErr2 }, { data: suppliers, error: suppliersErr }, { data: propertyRows, error: propertiesErr }] =
    await Promise.all([
      db.from("clients").select("*"),
      db.from("suppliers").select("*"),
      db.from("properties").select("*"),
    ]);

  if (clientsErr2) return NextResponse.json({ error: clientsErr2.message }, { status: 500 });
  if (suppliersErr) return NextResponse.json({ error: suppliersErr.message }, { status: 500 });
  if (propertiesErr) return NextResponse.json({ error: propertiesErr.message }, { status: 500 });

  return NextResponse.json({
    clients,
    suppliers,
    properties: (propertyRows ?? []).map((r) => r.data),
  });
}
