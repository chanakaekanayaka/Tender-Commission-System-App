import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { requireAuth } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validation/auth.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Self-service password change — scoped to the caller's own account via the JWT payload
 *  (`payload.userId`), never a target id in the request, so there's no way to change anyone
 *  else's password through this route. Distinct from Admin's PATCH /api/users/:id, which
 *  deliberately excludes password. */
export async function PATCH(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const input = changePasswordSchema.parse(body);

    await connectDB();
    const user = await UserModel.findById(payload.userId).select("+passwordHash");
    if (!user) {
      return apiError("Account not found.", 404);
    }

    const isCurrentPasswordValid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return apiError("Current password is incorrect.", 400);
    }
    if (input.newPassword === input.currentPassword) {
      return apiError("New password must be different from the current password.", 400);
    }

    user.passwordHash = await hashPassword(input.newPassword);
    await user.save();

    return apiSuccess(null, "Password changed successfully.");
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    console.error("PATCH /api/auth/change-password failed:", err);
    return apiError("Something went wrong while changing the password.", 500);
  }
}
