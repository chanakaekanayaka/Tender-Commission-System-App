import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { uploadDocumentToS3 } from "@/lib/aws/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Admin approving a Staff-submitted expense — requires uploading a payment receipt (evidence of
 *  the actual reimbursement) as the same real S3-upload pattern as Job Order payment proofs. This
 *  is a checkpoint, not the final word: `status` stays "Pending" until Staff reviews the receipt
 *  and confirms it (see confirm-payment), which is what actually moves the row into History. Only
 *  reachable for expenses not already bundled into an invoice (see POST /api/invoices), which get
 *  resolved together when that invoice is paid instead. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("Upload a payment receipt before approving.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Unsupported file type. Upload a PDF or image.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File is too large (max 15MB).", 400);
    }

    await connectDB();

    const expense = await OtherExpenseModel.findById(id);
    if (!expense) {
      return apiError("Expense not found.", 404);
    }
    if (expense.status !== "Pending") {
      return apiError("This expense has already been reviewed.", 400);
    }
    if (expense.invoiceId) {
      return apiError("This expense is bundled into an invoice — resolve it there instead.", 400);
    }
    if (expense.paymentProof) {
      return apiError("A payment receipt has already been uploaded for this expense.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `other-expenses/payment-proofs/${randomUUID()}/${file.name}`;
    await uploadDocumentToS3(buffer, s3Key, file.type);

    expense.paymentProof = { fileName: file.name, fileType: file.type, s3Key, uploadedAt: new Date() };
    await expense.save();

    return apiSuccess(expense.toJSON(), "Payment receipt uploaded — awaiting staff confirmation.");
  } catch (err) {
    console.error("PATCH /api/other-expenses/[id]/approve failed:", err);
    return apiError("Something went wrong while approving the expense.", 500);
  }
}
