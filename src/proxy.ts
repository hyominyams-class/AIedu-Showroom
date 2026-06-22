import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE } from "@/lib/access";

export function proxy(request: NextRequest) {
  const hasAccess = request.cookies.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/apps/:path*"],
};
