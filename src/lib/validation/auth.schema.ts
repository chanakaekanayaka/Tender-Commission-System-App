import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const permissionsSchema = z.object({
  canCreateJobOrders: z.boolean(),
  canViewPriceSchedules: z.boolean(),
  canApproveExpenses: z.boolean(),
  canManageUsers: z.boolean(),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  address: z.string().trim().optional().default(""),
  monthlyTarget: z.number().min(0).optional().default(0),
  role: z.enum(["Admin", "Staff"]),
  permissions: permissionsSchema.optional(),
});

// Every field optional — PATCH /api/users/:id updates only what's provided. Password isn't
// editable here; that would need its own "reset password" flow with re-hashing.
export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").optional(),
  address: z.string().trim().optional(),
  monthlyTarget: z.number().min(0).optional(),
  role: z.enum(["Admin", "Staff"]).optional(),
  permissions: permissionsSchema.optional(),
  status: z.enum(["Active", "Blocked"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
