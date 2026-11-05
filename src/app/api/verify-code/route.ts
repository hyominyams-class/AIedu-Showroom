import { isValidAccessCode } from "@/lib/access";
import { issueSession, sameOrigin } from "@/lib/server/session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false }, { status: 403 });
  try {
    const body = (await request.json()) as { code?: string };
    const code = typeof body.code === "string" ? body.code : "";

    if (!isValidAccessCode(code)) {
      return Response.json({ ok: false }, { status: 401 });
    }

    return Response.json(
      { ok: true },
      {
        headers: issueSession(request),
      },
    );
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
