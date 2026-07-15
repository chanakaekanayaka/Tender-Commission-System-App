import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/auth/cookies";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — same file, same job (runs before the route renders).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const payload = getAuthPayloadFromRequest(request);

  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Cross-portal guard: a Staff JWT hitting /admin/* (or vice versa) gets bounced to their own dashboard
  // instead of a blank/forbidden page.
  if (pathname.startsWith("/admin") && payload.role !== "Admin") {
    return NextResponse.redirect(new URL("/staff/dashboard", request.url));
  }

  if (pathname.startsWith("/staff") && payload.role !== "Staff") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
