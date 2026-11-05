import { NextRequest, NextResponse } from "next/server";
import { visitorFromRequest } from "@/lib/server/session";

export function proxy(request: NextRequest) {
  const hasAccess = Boolean(visitorFromRequest(request));

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/apps/:path*"],
};
