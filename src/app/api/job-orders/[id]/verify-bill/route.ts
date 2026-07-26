import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin approving a submitted bill — this, not merely `billDocument` existing, is what moves a
 *  Job Order out of Job Order Active and into Job Order Pending for both roles (see the Active/
 *  Pending page queries, which filter on billVerifiedAt). Distinct from verify-payment, which
 *  confirms the procuring entity actually paid once the row is already in Pending. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();

    const jobOrder = await JobOrderModel.findById(id);
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }
    if (!jobOrder.billDocument) {
      return apiError("Generate a bill before verifying it.", 400);
    }
    if (!jobOrder.billSubmittedAt) {
      return apiError("This bill hasn't been sent for verification yet.", 400);
    }

    jobOrder.billVerifiedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Bill verified successfully.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/verify-bill failed:", err);
    return apiError("Something went wrong while verifying the bill.", 500);
  }
}
