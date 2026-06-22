import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE, isValidAccessCode } from "@/lib/access";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body.code ?? "";

    if (!isValidAccessCode(code)) {
      return Response.json({ ok: false }, { status: 401 });
    }

    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": `${ACCESS_COOKIE_NAME}=${ACCESS_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=21600`,
        },
      },
    );
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
