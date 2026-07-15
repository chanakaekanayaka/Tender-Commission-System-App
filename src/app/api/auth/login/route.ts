import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { verifyPassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/cookies";
import { loginSchema } from "@/lib/validation/auth.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    await connectDB();

    // passwordHash is `select: false` on the schema — opt back in for this one lookup only.
    const user = await UserModel.findOne({ email }).select("+passwordHash");
    if (!user) {
      return apiError("Invalid email or password.", 401);
    }

    if (user.status === "Blocked") {
      return apiError("This account has been blocked. Contact your administrator.", 403);
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return apiError("Invalid email or password.", 401);
    }

    const token = signAuthToken({ userId: user._id.toString(), role: user.role });

    const response = apiSuccess(user.toJSON(), "Logged in successfully.");
    return attachAuthCookie(response, token);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Invalid input.", 422, error.flatten().fieldErrors);
    }
    console.error("POST /api/auth/login failed:", error);
    return apiError("Something went wrong while logging in.", 500);
  }
}
