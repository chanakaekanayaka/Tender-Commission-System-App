import { z } from "zod";

const jobOrderLineItemSchema = z.object({
  item: z.string().trim().min(1, "Item description is required"),
  qty: z.number().min(0, "Qty can't be negative"),
  unitPrice: z.number().min(0, "Unit price can't be negative"),
});

const jobOrderReceiptSchema = z.object({
  fileName: z.string().trim().min(1),
  amount: z.number().min(0),
  fileType: z.string().min(1),
  s3Key: z.string().min(1),
});

const jobOrderExpenseSchema = z.object({
  label: z.string().trim(),
  amount: z.number().min(0),
});

const jobOrderMetadataSchema = z.object({
  address: z.string(),
  telephone: z.string(),
  email: z.string(),
  note: z.string(),
});

export const saveJobOrderSchema = z.object({
  procurementNo: z.string().trim().min(1, "Procurement No is required"),
  procurementTitle: z.string().trim().min(1, "Procurement title is required"),
  procuringEntity: z.string().trim().min(1, "Procuring entity is required"),
  assignedStaffId: z.string().trim().optional().default(""),
  metadata: jobOrderMetadataSchema,
  originalLineItems: z.array(jobOrderLineItemSchema),
  lineItems: z.array(jobOrderLineItemSchema),
  receipts: z.array(jobOrderReceiptSchema),
  otherExpenses: z.array(jobOrderExpenseSchema),
  expensesZeroed: z.boolean(),
  markupValue: z.number().min(0),
  commissionValue: z.number().min(0),
  commissionZeroed: z.boolean(),
  completedStep: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(["Draft", "Completed"]),
});

export type SaveJobOrderInput = z.infer<typeof saveJobOrderSchema>;
