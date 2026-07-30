import { Schema, model, models, type Document, type Types } from "mongoose";

export interface JobOrderLineItemSubdoc {
  item: string;
  qty: number;
  unitPrice: number;
}

export interface JobOrderReceiptSubdoc {
  fileName: string;
  amount: number;
  fileType: string;
  /** S3 key from POST /api/job-orders/receipts — the client's blob preview URL is never sent here. */
  s3Key: string;
}

export interface JobOrderExpenseSubdoc {
  label: string;
  amount: number;
}

export interface JobOrderBillDocumentSubdoc {
  fileName: string;
  s3Key: string;
  generatedAt: Date;
}

export interface JobOrderPaymentProofSubdoc {
  fileName: string;
  fileType: string;
  s3Key: string;
  uploadedAt: Date;
}

export interface JobOrderSourceDocumentSubdoc {
  fileName: string;
  fileType: string;
  s3Key: string;
  uploadedAt: Date;
}

export interface JobOrderMetadataSubdoc {
  address: string;
  telephone: string;
  email: string;
  note: string;
}

export type JobOrderStatus = "Draft" | "Completed";
export type JobOrderCompletionStep = 1 | 2 | 3;

export interface JobOrderDocument extends Document {
  _id: Types.ObjectId;
  jobOrderNo: string;
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
  /** Plain string, not an ObjectId ref, on purpose for now — the "Assign to Staff" dropdown still
   *  runs on mock staff ids (that wiring hasn't been done yet), so this can't be cast/validated as
   *  a real User reference until it is. Revisit once that dropdown is wired to real staff. */
  assignedStaffId: string;
  /** Set by POST /api/job-orders/source-document — real upload only for now, no OCR parsing yet
   *  (Metadata fields stay manually typed until Textract is wired up for this document). */
  sourceDocument: JobOrderSourceDocumentSubdoc | null;
  metadata: JobOrderMetadataSubdoc;
  originalLineItems: JobOrderLineItemSubdoc[];
  lineItems: JobOrderLineItemSubdoc[];
  receipts: JobOrderReceiptSubdoc[];
  otherExpenses: JobOrderExpenseSubdoc[];
  /** Set by POST /api/job-orders/[id]/generate-bill — null until Generate Bill has actually run. */
  billDocument: JobOrderBillDocumentSubdoc | null;
  /** Frozen at the moment Generate Bill runs (newTotal + markup - commission - other expenses) —
   *  never recomputed live, so it can't silently drift if the job order is later reopened and
   *  its line items/markup edited. Null until a bill has been generated. */
  billAmount: number | null;
  /** Frozen alongside billAmount, same reasoning — markup minus commission and other expenses.
   *  Drives Job Order History's Profit column once the job order is paid and closed out. */
  profit: number | null;
  /** Set by POST /api/job-orders/[id]/submit-bill — when Staff generates the bill, it stays null
   *  until Staff explicitly sends it to Admin; when Admin generates/regenerates it themselves, the
   *  generate-bill route sets this immediately (no self-to-self send needed). Drives the "Job
   *  Pending" → "Verification Pending" status shown in Job Order Active. */
  billSubmittedAt: Date | null;
  /** Set by POST /api/job-orders/[id]/verify-bill — Admin approving the (already-submitted) bill.
   *  This, not merely `billDocument` existing, is what actually moves a row out of Job Order Active
   *  and into Job Order Pending for both roles. Reset to null on every regenerate, since the bill
   *  this was verified against no longer exists. */
  billVerifiedAt: Date | null;
  /** Set by PATCH /api/job-orders/[id]/verify-payment-proof — Admin confirming the Staff-uploaded
   *  payment proof looks legitimate. The row stays in Job Order Pending either way (shown as
   *  "Verified" once set) — this is a checkpoint, not the final gate. Reset to null whenever a new
   *  proof is uploaded, since the old proof this was checked against is gone. */
  paymentProofVerifiedAt: Date | null;
  /** Set by PATCH /api/job-orders/[id]/complete-payment — Admin confirming the FULL payment has
   *  actually been received (only reachable once paymentProofVerifiedAt is set). This, not merely
   *  the proof being verified, is what moves a row out of Job Order Pending and into History. */
  paymentVerifiedAt: Date | null;
  /** Set by PATCH /api/job-orders/[id]/pay-commission — Admin paying Staff their commission for
   *  this job order. Deliberately independent of `paymentVerifiedAt`: Staff can be paid their
   *  commission before the procuring entity has paid the company. Drives Commissions
   *  Pending/History for both roles. */
  commissionPaidAt: Date | null;
  /** Set by PATCH /api/job-orders/[id]/reject-commission — Admin declining to pay out this job
   *  order's commission (e.g. a dispute). Removes it from Commissions Pending without adding it to
   *  History, since nothing was actually paid. */
  commissionRejectedAt: Date | null;
  /** Set by POST /api/invoices when Staff bundles this commission into an invoice — removes it
   *  from Commissions Pending (both the standalone list and any other invoice) until that invoice
   *  is resolved, so the same commission can never be double-invoiced or double-paid. Cleared back
   *  to null only if that invoice concept needs undoing, which no current route does. */
  invoiceId: Types.ObjectId | null;
  /** Set by POST /api/job-orders/[id]/payment-proof — Staff uploads evidence (bank slip, cheque
   *  copy, etc.) once the procuring entity actually pays, so Admin has something to check before
   *  verifying it. Null until uploaded; uploading again replaces it. */
  paymentProof: JobOrderPaymentProofSubdoc | null;
  expensesZeroed: boolean;
  markupValue: number;
  commissionValue: number;
  commissionZeroed: boolean;
  completedStep: JobOrderCompletionStep;
  status: JobOrderStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<JobOrderLineItemSubdoc>(
  {
    item: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const receiptSchema = new Schema<JobOrderReceiptSubdoc>(
  {
    fileName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    fileType: { type: String, required: true },
    s3Key: { type: String, required: true },
  },
  { _id: false },
);

const expenseSchema = new Schema<JobOrderExpenseSubdoc>(
  {
    label: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const metadataSchema = new Schema<JobOrderMetadataSubdoc>(
  {
    address: { type: String, default: "" },
    telephone: { type: String, default: "" },
    email: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const billDocumentSchema = new Schema<JobOrderBillDocumentSubdoc>(
  {
    fileName: { type: String, required: true },
    s3Key: { type: String, required: true },
    generatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const paymentProofSchema = new Schema<JobOrderPaymentProofSubdoc>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    s3Key: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

const sourceDocumentSchema = new Schema<JobOrderSourceDocumentSubdoc>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    s3Key: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

const jobOrderSchema = new Schema<JobOrderDocument>(
  {
    jobOrderNo: { type: String, required: true, trim: true },
    procurementNo: { type: String, required: true, trim: true },
    procurementTitle: { type: String, required: true, trim: true },
    procuringEntity: { type: String, required: true, trim: true },
    assignedStaffId: { type: String, default: "" },
    sourceDocument: { type: sourceDocumentSchema, default: null },
    metadata: { type: metadataSchema, required: true },
    originalLineItems: { type: [lineItemSchema], required: true },
    lineItems: { type: [lineItemSchema], required: true },
    receipts: { type: [receiptSchema], default: [] },
    otherExpenses: { type: [expenseSchema], default: [] },
    billDocument: { type: billDocumentSchema, default: null },
    billAmount: { type: Number, default: null },
    profit: { type: Number, default: null },
    billSubmittedAt: { type: Date, default: null },
    billVerifiedAt: { type: Date, default: null },
    paymentProofVerifiedAt: { type: Date, default: null },
    paymentVerifiedAt: { type: Date, default: null },
    commissionPaidAt: { type: Date, default: null },
    commissionRejectedAt: { type: Date, default: null },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    paymentProof: { type: paymentProofSchema, default: null },
    expensesZeroed: { type: Boolean, default: false },
    markupValue: { type: Number, required: true, min: 0 },
    commissionValue: { type: Number, required: true, min: 0 },
    commissionZeroed: { type: Boolean, default: false },
    completedStep: { type: Number, enum: [1, 2, 3], required: true },
    status: { type: String, enum: ["Draft", "Completed"], default: "Draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// procurementNo: one Job Order per won tender — mirrors PriceSchedule's own unique procurementNo
// index. jobOrderNo: the human-facing reference, also unique. createdBy: Staff's "own records
// only" filter (AI_INSTRUCTIONS.md §3).
jobOrderSchema.index({ procurementNo: 1 }, { unique: true });
jobOrderSchema.index({ jobOrderNo: 1 }, { unique: true });
jobOrderSchema.index({ createdBy: 1 });
jobOrderSchema.index({ status: 1 });

jobOrderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    obj.createdBy = (obj.createdBy as Types.ObjectId).toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const JobOrderModel = models.JobOrder ?? model<JobOrderDocument>("JobOrder", jobOrderSchema);
