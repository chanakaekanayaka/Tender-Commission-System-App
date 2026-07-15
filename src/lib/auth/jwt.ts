import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@/shared/types/user.types";

// Annotated as `string` (rather than relying on a narrowing `if` before use) so the type holds
// inside the functions below too — TS doesn't carry narrowing across closure boundaries.
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET environment variable — set it in .env.local");
  return secret;
})();
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Returns null instead of throwing so callers can treat "missing" and "invalid" tokens the same way. */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}
