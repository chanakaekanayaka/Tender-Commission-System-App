import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Marks a Job Order's bill as paid — Admin-only, since Staff's Pending view is read-only
 *  monitoring of a bill Admin is chasing payment for. Once set, the record naturally drops out of
 *  the Pending query (GET /api/job-orders?view=pending filters on paymentVerifiedAt: null). */
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
      return apiError("Generate a bill before verifying payment.", 400);
    }

    jobOrder.paymentVerifiedAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Payment verified successfully.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/verify-payment failed:", err);
    return apiError("Something went wrong while verifying payment.", 500);
  }
}
