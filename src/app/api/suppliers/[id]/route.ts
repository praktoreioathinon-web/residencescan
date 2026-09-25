import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { Supplier } from "@/lib/data";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  if (user.role === "client") return forbidden();

  const updates = await req.json() as Partial<Supplier>;
  const db = supabaseServer();
  const { error } = await db.from("suppliers").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
