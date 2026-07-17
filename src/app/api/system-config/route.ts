import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { requireAuth, requireRole } from "@/lib/auth/guard";
import { updateSystemConfigSchema } from "@/lib/validation/system-config.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Both portals need the real VAT rate for accurate live totals (Price Schedule creation). */
export async function GET(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  await connectDB();
  const config = await getOrCreateSystemConfig();
  return apiSuccess(config.toJSON());
}

export async function PATCH(request: NextRequest) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    const body = await request.json();
    const updates = updateSystemConfigSchema.parse(body);

    await connectDB();
    const config = await getOrCreateSystemConfig();
    Object.assign(config, updates);
    await config.save();

    return apiSuccess(config.toJSON(), "System config updated successfully.");
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    console.error("PATCH /api/system-config failed:", err);
    return apiError("Something went wrong while updating system config.", 500);
  }
}
