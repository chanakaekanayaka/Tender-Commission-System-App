import { Schema, model, models, type Document, type Types } from "mongoose";

export interface SystemConfigLogoSubdoc {
  fileName: string;
  s3Key: string;
}

export interface SystemConfigDocument extends Document {
  _id: Types.ObjectId;
  /** Used to identify "our" vendor block inside an uploaded vendor comparison Excel (see
   *  VendorExcelUpload) — also shown on generated bills/spec sheets/payment letters. */
  companyName: string;
  isVatRegistered: boolean;
  vatPercentage: number;
  /** Days after a bill is generated before it's considered overdue — drives Job Order Pending's Due Date/"Due" badge. */
  paymentDueDays: number;
  /** Hex color driving the global sidebar background for both portals — see ThemeProvider. */
  themeColor: string;
  /** The company logo shown at the top of both portals' sidebars — null until Admin uploads one,
   *  in which case the sidebar falls back to the plain "TENDER-CMS" text. */
  logo: SystemConfigLogoSubdoc | null;
  createdAt: Date;
  updatedAt: Date;
}

const logoSchema = new Schema<SystemConfigLogoSubdoc>(
  {
    fileName: { type: String, required: true },
    s3Key: { type: String, required: true },
  },
  { _id: false },
);

const systemConfigSchema = new Schema<SystemConfigDocument>(
  {
    companyName: { type: String, default: "", trim: true },
    isVatRegistered: { type: Boolean, default: false },
    vatPercentage: { type: Number, default: 15, min: 0, max: 100 },
    paymentDueDays: { type: Number, default: 14, min: 0 },
    themeColor: { type: String, default: "#111827" },
    logo: { type: logoSchema, default: null },
  },
  { timestamps: true },
);

systemConfigSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const SystemConfigModel = models.SystemConfig ?? model<SystemConfigDocument>("SystemConfig", systemConfigSchema);

/** SystemConfig is a singleton — this app only ever needs one global config document. Lazily
 *  creates it with schema defaults on first read instead of requiring a separate seed script. */
export async function getOrCreateSystemConfig(): Promise<SystemConfigDocument> {
  const existing = await SystemConfigModel.findOne();
  if (existing) return existing;
  return SystemConfigModel.create({});
}
