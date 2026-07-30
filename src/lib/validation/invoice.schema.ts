import { z } from "zod";

export const createInvoiceSchema = z
  .object({
    commissionJobOrderIds: z.array(z.string().min(1)),
    expenseIds: z.array(z.string().min(1)),
  })
  .refine((data) => data.commissionJobOrderIds.length > 0 || data.expenseIds.length > 0, {
    message: "Select at least one commission or expense to include.",
  });
