import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin declining to pay out a job order's commission. Removes it from Commissions Pending
 *  without adding it to History, since nothing was actually paid. */
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
    if (jobOrder.commissionPaidAt) {
      return apiError("Commission has already been paid for this job order.", 400);
    }

    jobOrder.commissionRejectedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Commission rejected.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/reject-commission failed:", err);
    return apiError("Something went wrong while rejecting commission.", 500);
  }
}
