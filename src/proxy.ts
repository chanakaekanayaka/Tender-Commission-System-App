import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookieName";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — same file, same job (runs before the route renders).
//
// This only checks that the auth cookie is *present* — it deliberately does not verify the JWT
// signature (that needs JWT_SECRET, which AWS Amplify Hosting's Middleware/Edge compute does not
// receive, unlike the main SSR compute and API routes). Real verification + role enforcement
// happens server-side instead: AdminLayout/StaffLayout call getCurrentUser() (full JWT verify + DB
// lookup, including the cross-portal bounce), and every API route calls requireRole/requireAuth.
// Both run in the main compute, where env vars are available. This is just a cheap first gate to
// bounce anonymous visitors to /login before a page even renders.
export function proxy(request: NextRequest) {
  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
