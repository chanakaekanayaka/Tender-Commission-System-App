import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { uploadDocumentToS3 } from "@/lib/aws/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Admin paying Staff their commission for a job order — deliberately independent of whether the
 *  procuring entity has paid the company yet (paymentVerifiedAt). Requires a receipt upload (bank
 *  slip, cheque copy, etc.) as evidence, same pattern as Staff's own payment-proof upload. This is
 *  a checkpoint, not the final word: the row only leaves Commissions Pending for History once Staff
 *  separately confirms the receipt (see confirm-commission-payment). */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("Upload a payment receipt before paying commission.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Unsupported file type. Upload a PDF or image.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File is too large (max 15MB).", 400);
    }

    await connectDB();

    const jobOrder = await JobOrderModel.findById(id);
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }
    if (!jobOrder.billVerifiedAt) {
      return apiError("Verify the bill before paying commission.", 400);
    }
    if (!jobOrder.paymentProofVerifiedAt) {
      return apiError("Verify the payment proof before paying commission.", 400);
    }
    if (jobOrder.commissionPaidAt) {
      return apiError("Commission has already been paid for this job order.", 400);
    }
    if (jobOrder.commissionRejectedAt) {
      return apiError("This job order's commission was rejected.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `job-orders/commission-payment-proofs/${randomUUID()}/${file.name}`;
    await uploadDocumentToS3(buffer, s3Key, file.type);

    jobOrder.commissionPaymentProof = { fileName: file.name, fileType: file.type, s3Key, uploadedAt: new Date() };
    jobOrder.commissionPaidAt = new Date();
    await jobOrder.save();

    return apiSuccess(jobOrder.toJSON(), "Commission paid successfully.");
  } catch (err) {
    console.error("PATCH /api/job-orders/[id]/pay-commission failed:", err);
    return apiError("Something went wrong while paying commission.", 500);
  }
}
