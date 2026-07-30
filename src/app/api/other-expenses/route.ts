import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { requireAuth } from "@/lib/auth/guard";
import { createOtherExpenseSchema } from "@/lib/validation/other-expense.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Staff submitting a new standalone expense for reimbursement — always starts "Pending" until
 *  Admin approves or rejects it. Admin doesn't create these (see approve/reject routes instead). */
export async function POST(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const input = createOtherExpenseSchema.parse(body);

    await connectDB();
    const expense = await OtherExpenseModel.create({
      ...input,
      receipt: input.receipt ?? null,
      status: "Pending",
      reviewedAt: null,
      createdBy: payload.userId,
    });

    return apiSuccess(expense.toJSON(), "Expense saved successfully.", 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    console.error("POST /api/other-expenses failed:", err);
    return apiError("Something went wrong while saving the expense.", 500);
  }
}
