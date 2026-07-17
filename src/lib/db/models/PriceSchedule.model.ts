import { Schema, model, models, type Document, type Types } from "mongoose";
import type { PriceScheduleStatus } from "@/shared/types/tender.types";

export interface PriceScheduleLineItemSubdoc {
  item: string;
  qty: number;
  unitPrice: number;
}

export interface PriceScheduleDocument extends Document {
  _id: Types.ObjectId;
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
  closingDate: Date;
  lineItems: PriceScheduleLineItemSubdoc[];
  subTotal: number;
  vatAmount: number;
  totalValue: number;
  status: PriceScheduleStatus;
  sourceDocument?: { s3Key: string; fileName: string };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<PriceScheduleLineItemSubdoc>(
  {
    item: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const sourceDocumentSchema = new Schema(
  {
    s3Key: { type: String, required: true },
    fileName: { type: String, required: true },
  },
  { _id: false },
);

const priceScheduleSchema = new Schema<PriceScheduleDocument>(
  {
    procurementNo: { type: String, required: true, trim: true },
    procurementTitle: { type: String, required: true, trim: true },
    procuringEntity: { type: String, required: true, trim: true },
    closingDate: { type: Date, required: true },
    lineItems: { type: [lineItemSchema], required: true },
    subTotal: { type: Number, required: true, min: 0 },
    vatAmount: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Draft", "Completed"], default: "Draft" },
    sourceDocument: { type: sourceDocumentSchema, required: false },
    // ref: "User" so a future .populate("createdBy") can resolve the owner's name — not used yet.
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// createdBy: Staff's "own records only" filter (AI_INSTRUCTIONS.md §3). procurementNo: Job Order
// linking lookup. status: History table filtering by Draft/Completed.
priceScheduleSchema.index({ createdBy: 1 });
priceScheduleSchema.index({ procurementNo: 1 });
priceScheduleSchema.index({ status: 1 });

priceScheduleSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    obj.createdBy = (obj.createdBy as Types.ObjectId).toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const PriceScheduleModel = models.PriceSchedule ?? model<PriceScheduleDocument>("PriceSchedule", priceScheduleSchema);
