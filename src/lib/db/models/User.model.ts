import { Schema, model, models, type Document, type Types } from "mongoose";
import type { UserPermissions, UserRole, UserStatus } from "@/shared/types/user.types";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  address: string;
  monthlyTarget: number;
  role: UserRole;
  permissions: UserPermissions;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const permissionsSchema = new Schema<UserPermissions>(
  {
    canCreateJobOrders: { type: Boolean, default: true },
    canViewPriceSchedules: { type: Boolean, default: true },
    canApproveExpenses: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    // unique: true also creates the index we need for fast login lookups.
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // select: false keeps the hash out of every normal query result — routes must opt in explicitly.
    passwordHash: { type: String, required: true, select: false },
    address: { type: String, default: "" },
    monthlyTarget: { type: Number, default: 0 },
    role: { type: String, enum: ["Admin", "Staff"], required: true },
    permissions: { type: permissionsSchema, required: true },
    status: { type: String, enum: ["Active", "Blocked"], default: "Active" },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    // Recast to a plain index-signature type — mongoose's own `ret` type doesn't model
    // the shape it actually serializes to, and doesn't allow deleting its known fields.
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId).toString();
    delete obj._id;
    delete obj.passwordHash;
    delete obj.__v;
    return obj;
  },
});

// `models.User` reuses the compiled model on hot-reload instead of redefining it (Mongoose throws on redefinition).
export const UserModel = models.User ?? model<UserDocument>("User", userSchema);
