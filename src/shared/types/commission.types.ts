export interface PendingCommission {
  id: string;
  jobOrderNo: string;
  amount: number;
}

/** Staff's Commission History row — real record, so `paymentDate` (when Admin actually paid it)
 *  replaces the old mock's fabricated `paymentRefNo`, which has no real backing system. */
export interface CommissionHistoryRecord {
  id: string;
  jobOrderNo: string;
  amount: number;
  paymentDate: string;
}

/**
 * Admin's Pending Commissions row — awaiting Approve/Reject. One row per Job Order whose bill has
 * been verified (billVerifiedAt set) but whose commission hasn't been paid or rejected yet —
 * deliberately independent of whether the procuring entity has paid the company (paymentVerifiedAt).
 * `commissionRate` is derived (`commissionValue / profit * 100`) purely for display; `profit` (the
 * Overall Profit base) and `calculatedCommission` (`JobOrder.commissionValue`) are both real,
 * already-persisted figures — `calculatedCommission` is shown directly rather than re-derived from
 * the rounded rate, so it never drifts from what will actually be paid out.
 */
export interface AdminPendingCommission {
  id: string;
  staffName: string;
  jobOrderNo: string;
  profit: number;
  /** Percentage, e.g. 10 for 10% — rounded, for display only. */
  commissionRate: number;
  calculatedCommission: number;
}

/** Admin's Commission History row — already approved and paid out to staff. */
export interface AdminCommissionHistoryRecord {
  id: string;
  staffName: string;
  jobOrderNo: string;
  profit: number;
  commissionPaid: number;
  paymentDate: string;
}
