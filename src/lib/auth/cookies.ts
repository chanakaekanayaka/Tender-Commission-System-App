import type { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, type AuthTokenPayload } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookieName";

export { AUTH_COOKIE_NAME };

const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days — keep in sync with JWT_EXPIRES_IN

/** Attaches the session cookie to an outgoing API response. httpOnly keeps it unreadable from client JS (XSS-safe). */
export function attachAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

/** Shared by API routes and proxy.ts — both receive a NextRequest, so this works in either place unchanged. */
export function getAuthPayloadFromRequest(request: NextRequest): AuthTokenPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}
