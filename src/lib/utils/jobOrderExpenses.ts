import type { JobOrderDocument } from "@/lib/db/models/JobOrder.model";

/**
 * Step 2 receipts + manual Other Expenses total — what actually went to/was spent by Staff on the
 * job. Receipts always count; manual entries only when Staff hasn't zeroed them out — same rule
 * generate-bill uses for its own otherExpensesTotal, so this always matches the actual billed
 * figure. Shared by Job Order Active's Details modal and both Pending tables' "Amount" column, so
 * the same number is never computed two different ways.
 */
export function getExpensesAmount(record: JobOrderDocument): number {
  const receiptsTotal = record.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const manualExpensesTotal = record.expensesZeroed
    ? 0
    : record.otherExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  return receiptsTotal + manualExpensesTotal;
}
