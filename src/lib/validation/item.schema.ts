import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
});

export const itemSpecSchema = z.object({
  label: z.string().trim().min(1, "Spec name is required"),
  value: z.string().trim(),
});

export const updateItemSpecsSchema = z.object({
  specs: z.array(itemSpecSchema),
});

export type UpdateItemSpecsInput = z.infer<typeof updateItemSpecsSchema>;
