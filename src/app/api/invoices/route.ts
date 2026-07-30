import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel, type InvoiceLineItemSubdoc } from "@/lib/db/models/Invoice.model";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { nextInvoiceNo } from "@/lib/db/invoices";
import { requireAuth } from "@/lib/auth/guard";
import { createInvoiceSchema } from "@/lib/validation/invoice.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Staff bundling their own pending commissions and/or pending other-expenses into one invoice
 *  request. Every figure here is recomputed from the stored records, never trusted from the
 *  request body — only the chosen ids are read from it. Claims each bundled commission/expense
 *  (sets invoiceId) so it can't be double-invoiced or resolved individually elsewhere while this
 *  invoice is outstanding. */
export async function POST(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { commissionJobOrderIds, expenseIds } = createInvoiceSchema.parse(body);

    await connectDB();

    const jobOrders = await JobOrderModel.find({
      _id: { $in: commissionJobOrderIds },
      createdBy: payload.userId,
      billVerifiedAt: { $ne: null },
      commissionPaidAt: null,
      commissionRejectedAt: null,
      invoiceId: null,
    });
    if (jobOrders.length !== commissionJobOrderIds.length) {
      return apiError("One or more selected commissions are no longer available to invoice.", 400);
    }

    const expenses = await OtherExpenseModel.find({
      _id: { $in: expenseIds },
      createdBy: payload.userId,
      status: "Pending",
      invoiceId: null,
    });
    if (expenses.length !== expenseIds.length) {
      return apiError("One or more selected expenses are no longer available to invoice.", 400);
    }

    const items: InvoiceLineItemSubdoc[] = [
      ...jobOrders.map((jobOrder) => ({
        type: "commission" as const,
        refId: jobOrder._id,
        label: `Commission — ${jobOrder.jobOrderNo}`,
        amount: jobOrder.commissionValue,
      })),
      ...expenses.map((expense) => ({
        type: "expense" as const,
        refId: expense._id,
        label: expense.description,
        amount: expense.amount,
      })),
    ];
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    const invoiceNo = await nextInvoiceNo();
    const invoice = await InvoiceModel.create({
      invoiceNo,
      items,
      total,
      status: "Pending Review",
      paymentBill: null,
      paidAt: null,
      createdBy: payload.userId,
    });

    await Promise.all([
      jobOrders.length > 0
        ? JobOrderModel.updateMany({ _id: { $in: jobOrders.map((j) => j._id) } }, { invoiceId: invoice._id })
        : Promise.resolve(),
      expenses.length > 0
        ? OtherExpenseModel.updateMany({ _id: { $in: expenses.map((e) => e._id) } }, { invoiceId: invoice._id })
        : Promise.resolve(),
    ]);

    return apiSuccess(invoice.toJSON(), "Invoice generated successfully.", 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    console.error("POST /api/invoices failed:", err);
    return apiError("Something went wrong while generating the invoice.", 500);
  }
}
