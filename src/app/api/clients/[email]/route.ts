import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { ClientRecord } from "@/lib/data";

export async function PATCH(req: Request, { params }: { params: { email: string } }) {
  const updates = await req.json() as Partial<Omit<ClientRecord, "email">>;
  const db = supabaseServer();
  const { error } = await db.from("clients").update(updates).eq("email", decodeURIComponent(params.email));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
