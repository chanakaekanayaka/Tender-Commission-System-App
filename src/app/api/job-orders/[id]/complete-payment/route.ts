import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin confirming the FULL payment has actually been received — only reachable once the payment
 *  proof has already been verified (see verify-payment-proof). This, not merely the proof being
 *  verified, is what moves a row out of Job Order Pending and into History: it sets
 *  paymentVerifiedAt, the same field both pages' queries have always filtered on. */
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
      return apiError("Generate a bill before completing payment.", 400);
    }
    if (!jobOrder.paymentProofVerifiedAt) {
      return apiError("Verify the payment proof before completing payment.", 400);
    }

    jobOrder.paymentVerifiedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Payment marked complete.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/complete-payment failed:", err);
    return apiError("Something went wrong while completing payment.", 500);
  }
}
