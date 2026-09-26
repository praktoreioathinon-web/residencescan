import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";

const MAX_BYTES = 5_000_000;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = "residencescan-uploads";

// Stores an uploaded photo in Cloudflare R2 and returns its public URL.
// This is the whole point of moving off embedding photos as base64 in the
// property's own JSON document: a property with 184 equipment photos would
// otherwise need to re-send all 184 of them on every single edit, and
// eventually exceed the ~4.5MB request-size limit outright. Now every
// photoUrl the app ever stores is a short link, regardless of how many
// photos a property ends up with. R2 was chosen over Supabase Storage for
// its zero-egress-fee pricing at the scale of "as many properties as
// possible" with heavy photo documentation.
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
  const key = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: new Uint8Array(bytes),
        ContentType: "image/webp",
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  return NextResponse.json({ url });
}
