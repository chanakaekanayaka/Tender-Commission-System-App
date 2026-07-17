import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@/shared/types/user.types";

// Read lazily (inside the functions below), not at module-evaluation time: on AWS Amplify Hosting's
// Next.js compute, environment variables aren't reliably attached yet at the point shared server
// chunks first get evaluated — a top-level `process.env.JWT_SECRET` read there can throw even though
// the variable is correctly set. Reading it once each function actually runs avoids that.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET environment variable — set it in .env.local");
  return secret;
}

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });
}

/** Returns null instead of throwing so callers can treat "missing" and "invalid" tokens the same way. */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}
