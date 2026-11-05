import { visitorFromRequest } from "@/lib/server/session";
import { readStored } from "@/lib/server/store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const visitor = visitorFromRequest(request);
  if (!visitor) return new Response(null, { status: 401 });
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const image = await readStored(`images/${visitor}/${id}.png`);
    if (!image) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(image.bytes), { headers: {
      "Content-Type": "image/png", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff",
      ...(new URL(request.url).searchParams.has("download") ? { "Content-Disposition": 'attachment; filename="showroom-image.png"' } : {}),
    } });
  } catch { return new Response(null, { status: 503 }); }
}
