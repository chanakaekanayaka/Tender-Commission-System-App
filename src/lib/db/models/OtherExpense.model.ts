import { Schema, model, models, type Document, type Types } from "mongoose";

export interface OtherExpenseReceiptSubdoc {
  fileName: string;
  fileType: string;
  s3Key: string;
}

export type OtherExpenseStatus = "Pending" | "Approved" | "Rejected";

/**
 * A standalone expense Staff submits for reimbursement — deliberately isolated from Job Orders:
 * this is for work Admin asked a Staff member to do that isn't tied to any specific tender/job
 * order (e.g. an errand, a site visit unrelated to a live job). Distinct from the ad-hoc "Other
 * Expenses" entered inline during Job Order creation (JobOrder.model.ts's otherExpenses subdocs),
 * which are scoped to one job order and never leave it.
 */
export interface OtherExpenseDocument extends Document {
  _id: Types.ObjectId;
  description: string;
  amount: number;
  /** Bare "YYYY-MM-DD" string, not a Date — the expense's own date as Staff entered it via a date
   *  picker, parsed/formatted by hand elsewhere to avoid timezone drift (see dueDate.ts). */
  date: string;
  receipt: OtherExpenseReceiptSubdoc | null;
  status: OtherExpenseStatus;
  /** Set by PATCH .../approve or .../reject — null while still Pending. */
  reviewedAt: Date | null;
  /** Set by POST /api/invoices when Staff bundles this expense into an invoice — removes it from
   *  Expenses Pending until that invoice is resolved, so it can never be double-invoiced. */
  invoiceId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<OtherExpenseReceiptSubdoc>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    s3Key: { type: String, required: true },
  },
  { _id: false },
);

const otherExpenseSchema = new Schema<OtherExpenseDocument>(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
    receipt: { type: receiptSchema, default: null },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    reviewedAt: { type: Date, default: null },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// createdBy: Staff's "own records only" filter (AI_INSTRUCTIONS.md §3). status: both roles filter
// Pending vs. resolved (Approved/Rejected) lists on this.
otherExpenseSchema.index({ createdBy: 1 });
otherExpenseSchema.index({ status: 1 });

otherExpenseSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    obj.createdBy = (obj.createdBy as Types.ObjectId).toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const OtherExpenseModel = models.OtherExpense ?? model<OtherExpenseDocument>("OtherExpense", otherExpenseSchema);
