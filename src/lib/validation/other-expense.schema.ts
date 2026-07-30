import { z } from "zod";

const otherExpenseReceiptSchema = z.object({
  fileName: z.string().trim().min(1),
  fileType: z.string().min(1),
  s3Key: z.string().min(1),
});

export const createOtherExpenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().trim().min(1, "Date is required"),
  receipt: otherExpenseReceiptSchema.nullable().optional(),
});
