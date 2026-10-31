// Works out what an uploaded file really is from its first bytes, instead of
// believing the filename or the type the sender claims. Only the photo formats
// the app actually produces are recognised; anything else (HTML, SVG, PDFs,
// executables, …) comes back null and is refused.
export type SniffedImage = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const ascii = (b: Uint8Array, at: number, text: string) =>
  b.length >= at + text.length && text.split("").every((c, i) => b[at + i] === c.charCodeAt(0));

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  // JPEG: start-of-image marker followed by another marker
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  // PNG: 8-byte signature, then the IHDR header chunk
  if (bytes.length >= 16 && PNG_SIGNATURE.every((v, i) => bytes[i] === v) && ascii(bytes, 12, "IHDR")) {
    return { mime: "image/png", ext: "png" };
  }
  // WebP: RIFF container of type WEBP whose first chunk is lossy, lossless or extended
  if (bytes.length >= 16 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")
      && (ascii(bytes, 12, "VP8 ") || ascii(bytes, 12, "VP8L") || ascii(bytes, 12, "VP8X"))) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
