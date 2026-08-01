import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin discarding a Job Order from Job Order Active — a soft delete (sets `deletedAt`, never
 *  removes the record) so it can still surface in both roles' History, marked "Deleted", instead of
 *  vanishing without a trace. Only reachable pre-verification, matching where the "Delete" action
 *  actually lives in the UI (next to Verify in Job Order Active) — once billVerifiedAt is set the
 *  row has already moved on to Job Order Pending and isn't meant to be discarded this way. */
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
    if (jobOrder.deletedAt) {
      return apiError("This job order has already been deleted.", 400);
    }
    if (jobOrder.billVerifiedAt) {
      return apiError("This job order has already been verified and can no longer be deleted.", 400);
    }

    jobOrder.deletedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Job order deleted.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/delete failed:", err);
    return apiError("Something went wrong while deleting the job order.", 500);
  }
}
