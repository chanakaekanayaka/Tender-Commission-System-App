import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin declining a Staff-submitted expense — moves it from Pending into History (as Rejected)
 *  for both roles, rather than leaving it stuck in Pending forever. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();

    const expense = await OtherExpenseModel.findById(id);
    if (!expense) {
      return apiError("Expense not found.", 404);
    }
    if (expense.status !== "Pending") {
      return apiError("This expense has already been reviewed.", 400);
    }
    if (expense.invoiceId) {
      return apiError("This expense is bundled into an invoice — resolve it there instead.", 400);
    }
    if (expense.paymentProof) {
      return apiError("This expense has already been paid — resolve it via confirmation instead.", 400);
    }

    expense.status = "Rejected";
    expense.reviewedAt = new Date();
    await expense.save();

    return apiSuccess(expense.toJSON(), "Expense rejected.");
  } catch (err) {
    console.error("PATCH /api/other-expenses/[id]/reject failed:", err);
    return apiError("Something went wrong while rejecting the expense.", 500);
  }
}
