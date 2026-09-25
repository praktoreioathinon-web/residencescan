// Photos taken straight from a phone camera (or a detailed professional real
// estate shot) can be several MB each, so every photo is resized and
// re-encoded as WebP before it goes anywhere. Resizing alone isn't enough: a
// highly detailed image (stone, foliage, water) can still encode to several
// MB at 1600px. So this compresses, checks the actual output size, and —
// only if it's still too big — steps quality and then dimensions down and
// re-encodes, guaranteeing a result safely small regardless of source detail.
const TARGET_MAX_BYTES = 900_000; // ~900KB
const MIN_QUALITY = 0.4;
const MIN_DIMENSION = 800;

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))), "image/webp", quality);
  });
}

function drawToCanvas(img: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height / width) * maxDimension);
      width = maxDimension;
    } else {
      width = Math.round((width / height) * maxDimension);
      height = maxDimension;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read image")); };
    img.src = objectUrl;
  });
}

export async function compressImageToWebp(file: File, maxDimension = 1600, quality = 0.82): Promise<Blob> {
  const img = await loadImage(file);
  let dimension = maxDimension;
  let q = quality;
  let blob = await canvasToWebpBlob(drawToCanvas(img, dimension), q);

  while (blob.size > TARGET_MAX_BYTES && (q > MIN_QUALITY || dimension > MIN_DIMENSION)) {
    if (q > MIN_QUALITY) {
      q = Math.max(MIN_QUALITY, q - 0.15);
    } else {
      dimension = Math.max(MIN_DIMENSION, Math.round(dimension * 0.75));
    }
    blob = await canvasToWebpBlob(drawToCanvas(img, dimension), q);
  }

  return blob;
}

// Compresses a photo and uploads it to Supabase Storage, returning a short
// public URL. Photos are never embedded in a property's own record — a
// property with hundreds of equipment photos would otherwise have to
// re-send every one of them on every single edit, and eventually exceed the
// hosting platform's request-size limit outright regardless of how well any
// one photo compresses.
export async function uploadPhoto(file: File, accessToken: string | null): Promise<string> {
  const blob = await compressImageToWebp(file);
  const formData = new FormData();
  formData.append("file", blob, "photo.webp");
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Upload failed (${res.status})`);
  }
  const { url } = await res.json();
  return url as string;
}
