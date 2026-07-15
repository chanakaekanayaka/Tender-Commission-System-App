import { clearAuthCookie } from "@/lib/auth/cookies";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  const response = apiSuccess(null, "Logged out successfully.");
  return clearAuthCookie(response);
}
