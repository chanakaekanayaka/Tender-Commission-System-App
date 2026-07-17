import { z } from "zod";

export const lineItemSchema = z.object({
  item: z.string().trim().min(1, "Item description is required"),
  qty: z.number().positive("Qty must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price can't be negative"),
});

export const sourceDocumentSchema = z.object({
  s3Key: z.string().min(1),
  fileName: z.string().min(1),
});

export const createPriceScheduleSchema = z.object({
  procurementNo: z.string().trim().min(1, "Procurement No is required"),
  procurementTitle: z.string().trim().min(1, "Procurement title is required"),
  procuringEntity: z.string().trim().min(1, "Procuring entity is required"),
  closingDate: z.string().trim().min(1, "Closing date is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  status: z.enum(["Draft", "Completed"]),
  sourceDocument: sourceDocumentSchema.optional(),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;
export type CreatePriceScheduleInput = z.infer<typeof createPriceScheduleSchema>;
