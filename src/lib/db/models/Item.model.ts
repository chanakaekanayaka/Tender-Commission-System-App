import { Schema, model, models, type Document, type Types } from "mongoose";

export interface ItemSpecSubdoc {
  label: string;
  value: string;
}

export interface ItemDocument extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  /** Lowercased/trimmed `name`, used to match this item against Price Schedule line item text
   *  regardless of casing — never set directly, derived whenever `name` is set. */
  nameKey: string;
  imageKey?: string;
  specs: ItemSpecSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const itemSpecSchema = new Schema<ItemSpecSubdoc>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const itemSchema = new Schema<ItemDocument>(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true },
    imageKey: { type: String },
    specs: { type: [itemSpecSchema], default: [] },
  },
  { timestamps: true },
);

// code: auto-generated (ITM-0001, ...), must stay unique. nameKey: how Price Schedule line items
// are matched to an existing Item instead of creating a duplicate for the same product.
itemSchema.index({ code: 1 }, { unique: true });
itemSchema.index({ nameKey: 1 }, { unique: true });

itemSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    delete obj._id;
    delete obj.__v;
    delete obj.nameKey;
    delete obj.imageKey;
    return obj;
  },
});

export const ItemModel = models.Item ?? model<ItemDocument>("Item", itemSchema);
