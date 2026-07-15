import { cache } from "react";
import { cookies } from "next/headers";
import connectDB from "@/lib/db/connectDB";
import { UserModel, type UserDocument } from "@/lib/db/models/User.model";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

/**
 * Server Components/layouts only — reads the cookie via `next/headers` instead of a NextRequest
 * (route handlers and proxy.ts use `getAuthPayloadFromRequest` for that instead).
 *
 * Wrapped in React's `cache()` so a layout and the page it renders can both call this during the
 * same request without issuing the Mongo query twice.
 */
export const getCurrentUser = cache(async (): Promise<UserDocument | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  await connectDB();
  return UserModel.findById(payload.userId);
});
