import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { requireRole } from "@/lib/auth/guard";
import { updateUserSchema } from "@/lib/validation/auth.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const updates = updateUserSchema.parse(body);

    await connectDB();

    if (updates.email) {
      const existing = await UserModel.findOne({ email: updates.email, _id: { $ne: id } }).lean();
      if (existing) {
        return apiError("An account with this email already exists.", 409);
      }
    }

    const user = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return apiError("User not found.", 404);
    }

    return apiSuccess(user.toJSON(), "User updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Invalid input.", 422, error.flatten().fieldErrors);
    }
    console.error("PATCH /api/users/[id] failed:", error);
    return apiError("Something went wrong while updating the user.", 500);
  }
}
