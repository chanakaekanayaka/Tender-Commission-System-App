import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin paying Staff their commission for a job order — deliberately independent of whether the
 *  procuring entity has paid the company yet (paymentVerifiedAt). Requires billVerifiedAt (the
 *  same gate Job Order Pending itself uses), so a commission can't be paid before the bill it's
 *  based on has even been approved. Moves the row from Commissions Pending to History. */
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
    if (!jobOrder.billVerifiedAt) {
      return apiError("Verify the bill before paying commission.", 400);
    }
    if (jobOrder.commissionPaidAt) {
      return apiError("Commission has already been paid for this job order.", 400);
    }
    if (jobOrder.commissionRejectedAt) {
      return apiError("This job order's commission was rejected.", 400);
    }

    jobOrder.commissionPaidAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Commission paid successfully.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/pay-commission failed:", err);
    return apiError("Something went wrong while paying commission.", 500);
  }
}
