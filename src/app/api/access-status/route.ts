import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE } from "@/lib/access";

export async function GET() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;

  return Response.json({ hasAccess });
}
