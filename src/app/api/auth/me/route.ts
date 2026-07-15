import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { getAuthPayloadFromRequest } from "@/lib/auth/cookies";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Lets the frontend ask "who's logged in" without ever touching the JWT directly. */
export async function GET(request: NextRequest) {
  const payload = getAuthPayloadFromRequest(request);
  if (!payload) {
    return apiError("Not authenticated.", 401);
  }

  await connectDB();
  const user = await UserModel.findById(payload.userId);
  if (!user || user.status === "Blocked") {
    return apiError("Not authenticated.", 401);
  }

  return apiSuccess(user.toJSON(), "OK");
}
