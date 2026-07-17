import { z } from "zod";

export const updateSystemConfigSchema = z.object({
  isVatRegistered: z.boolean().optional(),
  vatPercentage: z.number().min(0).max(100).optional(),
});

export type UpdateSystemConfigInput = z.infer<typeof updateSystemConfigSchema>;
