// Photos taken straight from a phone camera (or a detailed professional real
// estate shot) can be several MB each. Every property is saved as one JSON
// document in a single request, and the hosting platform rejects any request
// body over ~4.5MB outright — so a single oversized photo doesn't just fail
// once, it fails identically on every retry with no way to recover except
// picking a different photo. Resizing alone isn't enough: a highly detailed
// image (stone, foliage, water) can still encode to several MB at 1600px.
// So this compresses, checks the actual output size, and — only if it's
// still too big — steps quality and then dimensions down and re-encodes,
// guaranteeing a result safely under the limit regardless of source detail.
const TARGET_MAX_BYTES = 900_000; // ~900KB, comfortably under the ~4.5MB request limit even alongside other data
const MIN_QUALITY = 0.4;
const MIN_DIMENSION = 800;

function drawToWebp(img: HTMLImageElement, maxDimension: number, quality: number): string {
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
  return canvas.toDataURL("image/webp", quality);
}

// Rough byte size of a data URL without actually decoding it.
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
}

export function compressImageToWebp(file: File, maxDimension = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let dimension = maxDimension;
        let q = quality;
        let result = drawToWebp(img, dimension, q);

        while (dataUrlBytes(result) > TARGET_MAX_BYTES && (q > MIN_QUALITY || dimension > MIN_DIMENSION)) {
          if (q > MIN_QUALITY) {
            q = Math.max(MIN_QUALITY, q - 0.15);
          } else {
            dimension = Math.max(MIN_DIMENSION, Math.round(dimension * 0.75));
          }
          result = drawToWebp(img, dimension, q);
        }

        resolve(result);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Could not process image"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image"));
    };
    img.src = objectUrl;
  });
}
