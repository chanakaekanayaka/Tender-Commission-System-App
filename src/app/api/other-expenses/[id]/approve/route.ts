import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin approving a Staff-submitted expense — moves it from Pending into History for both roles. */
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

    expense.status = "Approved";
    expense.reviewedAt = new Date();
    await expense.save();

    return apiSuccess(expense.toJSON(), "Expense approved successfully.");
  } catch (err) {
    console.error("PATCH /api/other-expenses/[id]/approve failed:", err);
    return apiError("Something went wrong while approving the expense.", 500);
  }
}
