import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Staff confirming they've reviewed Admin's uploaded payment receipt (paymentProof) and actually
 *  received the reimbursement — this, not merely paymentProof existing, is what flips `status` to
 *  "Approved" and moves the row out of Expenses Pending and into History for both roles. Only
 *  reachable by the Staff member who submitted the expense (AI_INSTRUCTIONS.md §3 — Other Expenses
 *  are always self-submitted, unlike Job Orders, so there's no separate "assigned" case to check). */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireRole(request, "Staff");
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();

    const expense = await OtherExpenseModel.findOne({ _id: id, createdBy: payload.userId });
    if (!expense) {
      return apiError("Expense not found.", 404);
    }
    if (!expense.paymentProof) {
      return apiError("Admin hasn't uploaded a payment receipt yet.", 400);
    }
    if (expense.paymentConfirmedAt) {
      return apiError("This payment has already been confirmed.", 400);
    }

    expense.paymentConfirmedAt = new Date();
    expense.status = "Approved";
    expense.reviewedAt = new Date();
    await expense.save();

    return apiSuccess(expense.toJSON(), "Payment confirmed.");
  } catch (err) {
    console.error("PATCH /api/other-expenses/[id]/confirm-payment failed:", err);
    return apiError("Something went wrong while confirming the payment.", 500);
  }
}
