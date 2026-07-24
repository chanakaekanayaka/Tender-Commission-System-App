import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getSignedImageUrl, uploadDocumentToS3 } from "@/lib/aws/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Staff uploads evidence that the procuring entity actually paid (bank slip, cheque copy, etc.)
 *  once a bill is out for payment — Admin then has something real to check before clicking Verify
 *  Payment on the Pending table. Uploading again replaces whatever was there before. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("No file uploaded.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Unsupported file type. Upload a PDF or image.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File is too large (max 15MB).", 400);
    }

    await connectDB();
    const filter = payload.role === "Admin" ? { _id: id } : { _id: id, createdBy: payload.userId };
    const jobOrder = await JobOrderModel.findOne(filter);
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }
    if (!jobOrder.billDocument) {
      return apiError("Generate a bill before uploading payment proof.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `job-orders/payment-proofs/${randomUUID()}/${file.name}`;
    await uploadDocumentToS3(buffer, s3Key, file.type);

    jobOrder.paymentProof = { fileName: file.name, fileType: file.type, s3Key, uploadedAt: new Date() };
    await jobOrder.save();

    const previewUrl = await getSignedImageUrl(s3Key);
    return apiSuccess(
      { fileName: file.name, fileType: file.type, previewUrl },
      "Payment proof uploaded successfully.",
      201,
    );
  } catch (err) {
    console.error("POST /api/job-orders/[id]/payment-proof failed:", err);
    return apiError("Something went wrong while uploading payment proof.", 500);
  }
}
