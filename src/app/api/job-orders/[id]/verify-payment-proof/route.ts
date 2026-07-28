import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin confirming the Staff-uploaded payment proof looks legitimate — this is a checkpoint, not
 *  the final word: the row stays in Job Order Pending either way (shown as "Verified" once this is
 *  set), and only actually leaves for History once Admin separately marks the payment complete
 *  (see complete-payment). Distinct from the Job Order Active table's verify-bill, which approves
 *  the bill PDF itself before it ever reaches Pending. */
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
      return apiError("Generate a bill before verifying payment proof.", 400);
    }
    if (!jobOrder.paymentProof) {
      return apiError("Staff hasn't uploaded payment proof yet — nothing to verify.", 400);
    }

    jobOrder.paymentProofVerifiedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Payment proof verified successfully.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/verify-payment-proof failed:", err);
    return apiError("Something went wrong while verifying payment proof.", 500);
  }
}
