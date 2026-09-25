import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";

const MAX_BYTES = 5_000_000;

// Stores an uploaded photo in Supabase Storage and returns its public URL.
// This is the whole point of moving off embedding photos as base64 in the
// property's own JSON document: a property with 184 equipment photos would
// otherwise need to re-send all 184 of them on every single edit, and
// eventually exceed the ~4.5MB request-size limit outright. Now every
// photoUrl the app ever stores is a short link, regardless of how many
// photos a property ends up with.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  if (user.role === "client") return forbidden();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;

  const db = supabaseServer();
  const { error } = await db.storage.from("property-photos").upload(path, bytes, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = db.storage.from("property-photos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
