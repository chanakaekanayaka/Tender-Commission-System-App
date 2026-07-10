export interface PendingCommission {
  id: string;
  jobOrderNo: string;
  amount: number;
}

export interface CommissionHistoryRecord {
  id: string;
  jobOrderNo: string;
  amount: number;
  paymentRefNo: string;
}

/**
 * Admin's Pending Commissions row — awaiting Approve/Reject. `calculatedCommission`
 * is deliberately not stored here — it's derived from `profit * commissionRate / 100`,
 * same as other derived totals elsewhere in the app.
 */
export interface AdminPendingCommission {
  id: string;
  staffName: string;
  jobOrderNo: string;
  profit: number;
  /** Percentage, e.g. 10 for 10%. */
  commissionRate: number;
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
