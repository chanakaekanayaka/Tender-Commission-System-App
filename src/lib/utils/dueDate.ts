// Bill-generated dates are stored as bare "YYYY-MM-DD" strings (see adminJobOrders.mock.ts).
// Parsing/formatting by hand (rather than via Date.parse/toISOString, which operate in UTC)
// keeps the calculation on the same calendar day the string represents, regardless of the
// browser's timezone offset.

export function calculateDueDate(billGeneratedDate: string, paymentDueDays: number): Date {
  const [year, month, day] = billGeneratedDate.split("-").map(Number);
  return new Date(year, month - 1, day + paymentDueDays);
}

// Overdue only once the current calendar day is strictly after the due date — the due date
// itself is not yet overdue.
export function isPaymentOverdue(dueDate: Date, today: Date): boolean {
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayMidnight.getTime() > dueDate.getTime();
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
