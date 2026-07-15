import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { requireRole } from "@/lib/auth/guard";
import { apiSuccess } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  await connectDB();
  const users = await UserModel.find().sort({ createdAt: -1 });

  return apiSuccess(users.map((user) => user.toJSON()));
}
