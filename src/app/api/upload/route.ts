import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireUser, unauthorized, forbidden } from "@/lib/auth-server";
import { sniffImage } from "@/lib/image-type";

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
//
// The bucket is public, so what goes into it is checked rather than trusted:
// the file must really be a JPEG, PNG or WebP (judged by its bytes, not its
// name or claimed type) and is stored with the matching content type.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  if (user.role === "client") return forbidden();

  // Refuse an oversized body before reading it.
  const declared = Number(req.headers.get("content-length"));
  if (declared > MAX_BYTES + 100_000) {
    return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP photos can be uploaded." }, { status: 415 });
  }

  const key = `photos/${crypto.randomUUID()}.${kind.ext}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: bytes,
        ContentType: kind.mime,
        // Every upload gets a new unique name and is never edited afterwards.
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (err) {
    console.error("R2 upload failed", err);
    return NextResponse.json({ error: "Upload failed — please try again." }, { status: 500 });
  }

  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  return NextResponse.json({ url });
}
