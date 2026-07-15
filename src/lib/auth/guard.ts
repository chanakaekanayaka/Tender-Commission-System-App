import type { NextRequest } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/auth/cookies";
import type { AuthTokenPayload } from "@/lib/auth/jwt";
import { apiError } from "@/lib/api/response";
import type { UserRole } from "@/shared/types/user.types";

type GuardResult = { payload: AuthTokenPayload; error: null } | { payload: null; error: Response };

/**
 * proxy.ts only gates page navigations, not API routes — each Route Handler that touches
 * sensitive data must check for itself. Callers do: `const { payload, error } = requireRole(...); if (error) return error;`
 */
export function requireRole(request: NextRequest, role: UserRole): GuardResult {
  const payload = getAuthPayloadFromRequest(request);
  if (!payload) {
    return { payload: null, error: apiError("Not authenticated.", 401) };
  }
  if (payload.role !== role) {
    return { payload: null, error: apiError("You don't have permission to do this.", 403) };
  }
  return { payload, error: null };
}
