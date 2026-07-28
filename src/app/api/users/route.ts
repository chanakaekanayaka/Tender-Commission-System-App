import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { requireRole } from "@/lib/auth/guard";
import { apiSuccess } from "@/lib/api/response";

/** Plain, unfiltered call is the Users management list's own real data source... except that page
 *  is a server component and queries UserModel directly, so this route currently has no caller of
 *  its own kind — until `?role=&status=` showed up, needed by the Job Order wizard's "Assign to
 *  Staff" dropdown (Admin only, browsing who's available to assign a job order to). */
export async function GET(request: NextRequest) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  const role = request.nextUrl.searchParams.get("role");
  const status = request.nextUrl.searchParams.get("status");

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (role === "Admin" || role === "Staff") filter.role = role;
  if (status === "Active" || status === "Blocked") filter.status = status;

  const users = await UserModel.find(filter).sort({ createdAt: -1 });

  return apiSuccess(users.map((user) => user.toJSON()));
}
