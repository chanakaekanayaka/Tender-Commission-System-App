import { Schema, model, models, type Document, type Types } from "mongoose";

export interface SystemConfigDocument extends Document {
  _id: Types.ObjectId;
  isVatRegistered: boolean;
  vatPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<SystemConfigDocument>(
  {
    isVatRegistered: { type: Boolean, default: false },
    vatPercentage: { type: Number, default: 15, min: 0, max: 100 },
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
