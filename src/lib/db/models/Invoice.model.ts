import { Schema, model, models, type Document, type Types } from "mongoose";

export type InvoiceLineItemType = "commission" | "expense";

/** A frozen snapshot of one bundled commission (refId → JobOrder) or expense (refId →
 *  OtherExpense) at the moment Staff generated the invoice — label/amount never drift afterward
 *  even if the underlying record's own figures somehow changed. */
export interface InvoiceLineItemSubdoc {
  type: InvoiceLineItemType;
  refId: Types.ObjectId;
  label: string;
  amount: number;
}

export interface InvoicePaymentBillSubdoc {
  fileName: string;
  fileType: string;
  s3Key: string;
}

export type InvoiceStatus = "Pending Review" | "Paid";

/**
 * Staff bundling one or more of their own pending commissions and/or pending other-expenses into
 * a single request Admin settles at once — uploading one payment bill marks the whole invoice
 * (and every commission/expense it bundled) paid/approved together. See POST /api/invoices and
 * PATCH /api/invoices/[id]/pay.
 */
export interface InvoiceDocument extends Document {
  _id: Types.ObjectId;
  invoiceNo: string;
  items: InvoiceLineItemSubdoc[];
  total: number;
  status: InvoiceStatus;
  /** Set by PATCH /api/invoices/[id]/pay — the receipt/bill Admin uploaded as proof of payment. */
  paymentBill: InvoicePaymentBillSubdoc | null;
  paidAt: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<InvoiceLineItemSubdoc>(
  {
    type: { type: String, enum: ["commission", "expense"], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const paymentBillSchema = new Schema<InvoicePaymentBillSubdoc>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    s3Key: { type: String, required: true },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceNo: { type: String, required: true, trim: true, unique: true },
    items: { type: [lineItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Pending Review", "Paid"], default: "Pending Review" },
    paymentBill: { type: paymentBillSchema, default: null },
    paidAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// invoiceNo: human-facing reference, unique. createdBy: Staff's "own records only" filter
// (AI_INSTRUCTIONS.md §3). status: both roles' Requests/History split on this.
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ status: 1 });

invoiceSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    obj.createdBy = (obj.createdBy as Types.ObjectId).toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const InvoiceModel = models.Invoice ?? model<InvoiceDocument>("Invoice", invoiceSchema);
