import { z } from "zod";

export const updateSystemConfigSchema = z.object({
  isVatRegistered: z.boolean().optional(),
  vatPercentage: z.number().min(0).max(100).optional(),
  paymentDueDays: z.number().min(0).optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color (e.g. #111827).")
    .optional(),
});

export type UpdateSystemConfigInput = z.infer<typeof updateSystemConfigSchema>;
