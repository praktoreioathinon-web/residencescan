import { appIcon } from "@/lib/app-icon";

const SIZES = new Set([192, 512]);

export function GET(_req: Request, { params }: { params: { size: string } }) {
  const size = Number(params.size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return appIcon(size);
}
