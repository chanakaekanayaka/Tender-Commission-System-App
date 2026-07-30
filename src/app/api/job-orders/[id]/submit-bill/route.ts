import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Staff sending a generated bill to Admin for review — the explicit hand-off that flips Job Order
 *  Active's status from "Job Pending" to "Verification Pending". Admin generating/regenerating a
 *  bill themselves skips this (generate-bill sets billSubmittedAt directly), so this route is only
 *  reachable for Staff's own records — either created by them or assigned to them by Admin. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();
    const filter =
      payload.role === "Admin"
        ? { _id: id }
        : { _id: id, $or: [{ createdBy: payload.userId }, { assignedStaffId: payload.userId }] };

    const jobOrder = await JobOrderModel.findOne(filter);
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }
    if (!jobOrder.billDocument) {
      return apiError("Generate a bill before sending it to Admin.", 400);
    }
    if (jobOrder.billSubmittedAt) {
      return apiError("This bill has already been sent to Admin.", 400);
    }

    jobOrder.billSubmittedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Bill sent to Admin for verification.");
  } catch (err) {
    console.error("POST /api/job-orders/[id]/submit-bill failed:", err);
    return apiError("Something went wrong while sending the bill to Admin.", 500);
  }
}
