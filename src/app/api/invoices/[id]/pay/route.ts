import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel, type InvoiceLineItemSubdoc } from "@/lib/db/models/Invoice.model";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getSignedImageUrl, uploadDocumentToS3 } from "@/lib/aws/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Admin uploading the payment bill/receipt that settles an invoice in full — the one action that
 *  marks it Paid. Cascades to every commission and expense the invoice bundled, fully finalizing
 *  each one (not just a checkpoint): every linked Job Order gets commissionPaidAt AND
 *  commissionPaymentConfirmedAt set (bundling into an invoice is itself Staff's request for
 *  payment, so there's no separate post-payment confirmation step the way the standalone
 *  pay-commission flow has), and every linked Other Expense gets Approved the same way. Both also
 *  get the invoice's own bill recorded as their own payment proof, so their standalone History
 *  pages show the same receipt without any extra plumbing. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireRole(request, "Admin");
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
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      return apiError("Invoice not found.", 404);
    }
    if (invoice.status === "Paid") {
      return apiError("This invoice has already been paid.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `invoices/payment-bills/${randomUUID()}/${file.name}`;
    await uploadDocumentToS3(buffer, s3Key, file.type);

    invoice.paymentBill = { fileName: file.name, fileType: file.type, s3Key };
    invoice.status = "Paid";
    invoice.paidAt = new Date();
    await invoice.save();

    const jobOrderIds = invoice.items
      .filter((item: InvoiceLineItemSubdoc) => item.type === "commission")
      .map((item: InvoiceLineItemSubdoc) => item.refId);
    const expenseIds = invoice.items
      .filter((item: InvoiceLineItemSubdoc) => item.type === "expense")
      .map((item: InvoiceLineItemSubdoc) => item.refId);
    const now = new Date();

    const paymentProof = { fileName: file.name, fileType: file.type, s3Key, uploadedAt: now };

    await Promise.all([
      jobOrderIds.length > 0
        ? JobOrderModel.updateMany(
            { _id: { $in: jobOrderIds } },
            { commissionPaidAt: now, commissionPaymentProof: paymentProof, commissionPaymentConfirmedAt: now },
          )
        : Promise.resolve(),
      expenseIds.length > 0
        ? OtherExpenseModel.updateMany(
            { _id: { $in: expenseIds } },
            { status: "Approved", reviewedAt: now, paymentProof, paymentConfirmedAt: now },
          )
        : Promise.resolve(),
    ]);

    const previewUrl = await getSignedImageUrl(s3Key);
    return apiSuccess({ ...invoice.toJSON(), paymentBillUrl: previewUrl }, "Invoice marked as paid.");
  } catch (err) {
    console.error("PATCH /api/invoices/[id]/pay failed:", err);
    return apiError("Something went wrong while marking the invoice as paid.", 500);
  }
}
