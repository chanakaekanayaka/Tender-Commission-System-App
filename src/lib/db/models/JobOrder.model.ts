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
  /** Set by PATCH /api/job-orders/[id]/verify-payment — null until Admin verifies payment came
   *  in. Drives Job Order Pending: a bill with a null value here is still awaiting payment. */
  paymentVerifiedAt: Date | null;
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

const jobOrderSchema = new Schema<JobOrderDocument>(
  {
    jobOrderNo: { type: String, required: true, trim: true },
    procurementNo: { type: String, required: true, trim: true },
    procurementTitle: { type: String, required: true, trim: true },
    procuringEntity: { type: String, required: true, trim: true },
    assignedStaffId: { type: String, default: "" },
    metadata: { type: metadataSchema, required: true },
    originalLineItems: { type: [lineItemSchema], required: true },
    lineItems: { type: [lineItemSchema], required: true },
    receipts: { type: [receiptSchema], default: [] },
    otherExpenses: { type: [expenseSchema], default: [] },
    billDocument: { type: billDocumentSchema, default: null },
    billAmount: { type: Number, default: null },
    paymentVerifiedAt: { type: Date, default: null },
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
