import { Schema, model, models, type Document, type Types } from "mongoose";

export interface VendorExcelItemSubdoc {
  itemNo?: number;
  description: string;
  qty: number;
  unit: string;
  unitPriceExclVat: number;
  transport: number;
  subTotal: number;
  discount: number;
  priceWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
}

export interface VendorExcelBlockSubdoc {
  vendorName: string;
  items: VendorExcelItemSubdoc[];
}

export interface VendorExcelSourceDocument {
  s3Key: string;
  fileName: string;
}

export type VendorExcelUploadStatus = "Pending" | "Linked";

export interface VendorExcelUploadDocument extends Document {
  _id: Types.ObjectId;
  /** Copied from the linked Price Schedule at link time — unset while Pending. */
  procurementNo?: string;
  priceScheduleId?: Types.ObjectId;
  status: VendorExcelUploadStatus;
  /** SHA-256 of the raw file bytes — rejects re-uploading the exact same Excel a second time. */
  contentHash: string;
  /** Explicit human review gate — an upload only feeds Market Analysis once someone confirms the
   *  parsed data looks right (see getTenderMarketComparisons), never automatically on upload. */
  confirmed: boolean;
  sourceDocument: VendorExcelSourceDocument;
  vendorBlocks: VendorExcelBlockSubdoc[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vendorExcelItemSchema = new Schema<VendorExcelItemSubdoc>(
  {
    itemNo: { type: Number },
    description: { type: String, required: true, trim: true },
    qty: { type: Number, default: 0 },
    unit: { type: String, default: "", trim: true },
    unitPriceExclVat: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    priceWithoutVat: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    totalWithVat: { type: Number, default: 0 },
  },
  { _id: false },
);

const vendorExcelBlockSchema = new Schema<VendorExcelBlockSubdoc>(
  {
    vendorName: { type: String, required: true, trim: true },
    items: { type: [vendorExcelItemSchema], default: [] },
  },
  { _id: false },
);

const sourceDocumentSchema = new Schema<VendorExcelSourceDocument>(
  {
    s3Key: { type: String, required: true },
    fileName: { type: String, required: true },
  },
  { _id: false },
);

const vendorExcelUploadSchema = new Schema<VendorExcelUploadDocument>(
  {
    procurementNo: { type: String, trim: true },
    priceScheduleId: { type: Schema.Types.ObjectId, ref: "PriceSchedule" },
    status: { type: String, enum: ["Pending", "Linked"], default: "Pending" },
    contentHash: { type: String, required: true },
    confirmed: { type: Boolean, default: false },
    sourceDocument: { type: sourceDocumentSchema, required: true },
    vendorBlocks: { type: [vendorExcelBlockSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// createdBy: Staff "own records only" filter (AI_INSTRUCTIONS.md §3). status: Pending/Linked tab
// filtering on the list page. procurementNo/priceScheduleId: lookups once linked to a tender.
// contentHash: duplicate-upload lookup, not unique — an upload can be deleted and legitimately
// re-uploaded later, so this only needs to catch the currently-live duplicate, not forbid the hash forever.
vendorExcelUploadSchema.index({ createdBy: 1 });
vendorExcelUploadSchema.index({ status: 1 });
vendorExcelUploadSchema.index({ procurementNo: 1 });
vendorExcelUploadSchema.index({ priceScheduleId: 1 });
vendorExcelUploadSchema.index({ contentHash: 1 });
vendorExcelUploadSchema.index({ confirmed: 1 });

vendorExcelUploadSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    obj.createdBy = (obj.createdBy as Types.ObjectId).toString();
    if (obj.priceScheduleId) obj.priceScheduleId = (obj.priceScheduleId as Types.ObjectId).toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const VendorExcelUploadModel =
  models.VendorExcelUpload ?? model<VendorExcelUploadDocument>("VendorExcelUpload", vendorExcelUploadSchema);
