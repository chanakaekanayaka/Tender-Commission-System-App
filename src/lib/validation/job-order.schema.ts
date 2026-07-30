import { z } from "zod";
import { isValidEmail, isValidPhone } from "./contactValidation";

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
  telephone: z.string().refine(isValidPhone, "Enter a valid telephone number"),
  email: z.string().refine(isValidEmail, "Enter a valid email address"),
  note: z.string(),
});

const jobOrderSourceDocumentSchema = z.object({
  fileName: z.string().trim().min(1),
  fileType: z.string().min(1),
  s3Key: z.string().min(1),
  uploadedAt: z.string().min(1),
});

export const saveJobOrderSchema = z.object({
  procurementNo: z.string().trim().min(1, "Procurement No is required"),
  procurementTitle: z.string().trim().min(1, "Procurement title is required"),
  procuringEntity: z.string().trim().min(1, "Procuring entity is required"),
  assignedStaffId: z.string().trim().optional().default(""),
  sourceDocument: jobOrderSourceDocumentSchema.nullable().optional(),
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
