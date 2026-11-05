import { visitorFromRequest } from "@/lib/server/session";

export async function GET(request: Request) {
  return Response.json({ hasAccess: Boolean(visitorFromRequest(request)) }, { headers: { "Cache-Control": "no-store" } });
}
