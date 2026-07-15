import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validation/auth.schema";
import { apiError, apiSuccess } from "@/lib/api/response";
import { ADMIN_PERMISSIONS, DEFAULT_PERMISSIONS } from "@/shared/types/user.types";

/** Registers a new Admin/Staff account. There's no public sign-up — this is called from the Admin "Create User" form. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    await connectDB();

    const existing = await UserModel.findOne({ email: input.email }).lean();
    if (existing) {
      return apiError("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const permissions =
      input.permissions ?? (input.role === "Admin" ? ADMIN_PERMISSIONS : DEFAULT_PERMISSIONS);

    const user = await UserModel.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      address: input.address,
      monthlyTarget: input.monthlyTarget,
      role: input.role,
      permissions,
      status: "Active",
    });

    return apiSuccess(user.toJSON(), "User registered successfully.", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Invalid input.", 422, error.flatten().fieldErrors);
    }
    console.error("POST /api/auth/register failed:", error);
    return apiError("Something went wrong while creating the account.", 500);
  }
}
