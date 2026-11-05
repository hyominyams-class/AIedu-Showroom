import { aiPolicy, type AiAppSlug } from "@/lib/ai-policy";
import { getQuota } from "@/lib/server/quota";
import { visitorFromRequest } from "@/lib/server/session";

export async function GET(request: Request) {
  const visitor = visitorFromRequest(request);
  if (!visitor) return Response.json({ ok: false, error: "다시 입장해 주세요." }, { status: 401 });
  const slug = new URL(request.url).searchParams.get("app") || "";
  if (!aiPolicy(slug)) return Response.json({ ok: false }, { status: 404 });
  try {
    return Response.json({ ok: true, ...await getQuota(visitor, slug as AiAppSlug) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "남은 횟수를 확인하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}
