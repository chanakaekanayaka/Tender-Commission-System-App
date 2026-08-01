import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Staff confirming they've reviewed Admin's uploaded commission payment receipt
 *  (commissionPaymentProof) and it looks legitimate — this, not merely commissionPaidAt being set,
 *  is what moves the row out of Commissions Pending and into Commissions History for both roles.
 *  Only reachable by the Staff member the job order actually belongs to (created by them or
 *  assigned to them by Admin), same ownership rule as the rest of Job Orders (AI_INSTRUCTIONS.md §3). */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireRole(request, "Staff");
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();

    const jobOrder = await JobOrderModel.findOne({
      _id: id,
      $or: [{ createdBy: payload.userId }, { assignedStaffId: payload.userId }],
    });
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }
    if (!jobOrder.commissionPaidAt) {
      return apiError("Admin hasn't paid this commission yet.", 400);
    }
    if (jobOrder.commissionPaymentConfirmedAt) {
      return apiError("This commission payment has already been confirmed.", 400);
    }

    jobOrder.commissionPaymentConfirmedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Commission payment confirmed.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/confirm-commission-payment failed:", err);
    return apiError("Something went wrong while confirming the commission payment.", 500);
  }
}
