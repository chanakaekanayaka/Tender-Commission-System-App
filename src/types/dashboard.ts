export interface MonthlyPerformance {
  month: string;
  sales: number;
  target: number;
}

export interface StaffMonthlyPerformance {
  month: string;
  amount: number;
}

export interface PriceScheduleTrendPoint {
  month: string;
  count: number;
}

/** A Price Schedule ("bid") counted toward the current calendar month's "This Month Bidding" card —
 *  only ones Staff actually completed (submitted), not still-in-progress Drafts. */
export interface ThisMonthBidRow {
  id: string;
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
  totalValue: number;
  /** Formatted "YYYY-MM-DD" in Sri Lanka local time — see `formatDateOnly`. */
  createdDate: string;
}

/** A Job Order counted toward "Orders to Complete" — same real gate Staff's own Job Orders >
 *  Pending tab uses (bill verified, awaiting the procuring entity's payment, payment proof not yet
 *  verified), scoped to this Staff member's own records (created by them or assigned to them by
 *  Admin) — deliberately not Admin's own (unscoped) Pending gate. */
export interface OrderToCompleteRow {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  total: number;
}

/** A Job Order counted toward "Monthly Target"'s achieved amount — created this calendar month,
 *  regardless of how far its own commission has progressed since. */
export interface MonthlyTargetOrderRow {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  commissionValue: number;
  /** Formatted "YYYY-MM-DD" in Sri Lanka local time — see `formatDateOnly`. */
  createdDate: string;
}

/** A Job Order counted toward "My Pending Commission" — same real gate Commissions Pending itself
 *  uses (bill + payment proof verified, not yet confirmed or rejected, not bundled into an invoice). */
export interface PendingCommissionRow {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  commissionValue: number;
}

/** A Job Order counted toward Admin's "Monthly Sales Target" achieved amount — created this
 *  calendar month, company-wide (not scoped to any one Staff member). */
export interface MonthlySalesTargetOrderRow {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  staffName: string;
  total: number;
  /** Formatted "YYYY-MM-DD" in Sri Lanka local time — see `formatDateOnly`. */
  createdDate: string;
}

/** A Job Order counted toward Admin's "Total Pending Payments" — same real gate Admin's own Job
 *  Orders > Pending tab uses (bill verified, awaiting the procuring entity's payment),
 *  company-wide. `billGeneratedDate` is a bare "YYYY-MM-DD" string (not a formatted display value)
 *  so the card can derive its own Due Date/overdue status the same way AdminPendingTable already
 *  does, via `calculateDueDate`/`isPaymentOverdue`. */
export interface TotalPendingPaymentRow {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  billAmount: number;
  billGeneratedDate: string;
}

/** A Job Order counted toward Admin's "Total Pending Orders" — anything not yet in History
 *  (`paymentVerifiedAt` still null), company-wide: "Active" (bill not yet verified) or "Pending"
 *  (bill verified, awaiting the procuring entity's payment). `billGeneratedDate` is only present
 *  for Pending-stage rows — used to derive Due Date/overdue status the same way
 *  AdminPendingTable/TotalPendingPaymentsCard already do. */
export interface TotalPendingOrderRow {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  total: number;
  status: "Active" | "Pending";
  billGeneratedDate?: string;
}
