import type { JobOrderDocument } from "@/lib/db/models/JobOrder.model";
import { calculateLineItemTotals } from "@/lib/utils/pricing";

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

/**
 * Sum of the (possibly edited) line items' subtotals — the same "New Total" Step 3's Sales
 * Commission is actually calculated against (see JobOrderWizardContext's `newTotal`). Recomputed
 * server-side wherever that real figure is needed outside the wizard itself, e.g. deriving the
 * commission rate shown in Commissions Pending.
 */
export function getNewTotal(record: JobOrderDocument, vatRate: number): number {
  return record.lineItems.reduce(
    (sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal,
    0,
  );
}

/**
 * "Overall Profit" — New Total minus Other Expenses, the base Step 3's Financial Summary splits
 * between Company Profit and Sales Commission (see JobOrderWizardContext's `profitBase`). Can be
 * negative (a loss). Recomputed server-side wherever a real figure is needed outside the wizard
 * itself, e.g. Commissions Pending/History.
 */
export function getProfitBase(record: JobOrderDocument, vatRate: number): number {
  return getNewTotal(record, vatRate) - getExpensesAmount(record);
}
