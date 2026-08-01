export interface PendingCommission {
  id: string;
  jobOrderNo: string;
  amount: number;
}

/** Staff's Commission History row — real record, so `uploadedAt` (the receipt's real upload
 *  timestamp, date + time) replaces the old mock's fabricated `paymentRefNo`, which has no real
 *  backing system. Carries the same receipt Admin uploaded at payout time
 *  (`JobOrder.commissionPaymentProof`), so Staff can still look it up after the fact, not just
 *  while it was Pending. */
export interface CommissionHistoryRecord {
  id: string;
  jobOrderNo: string;
  amount: number;
  /** Formatted "YYYY-MM-DD HH:MM" — see `formatDateTime`. */
  uploadedAt: string;
  receiptFileName: string;
  receiptFileType: string;
  receiptUrl: string;
  /** Set only when this commission was settled by bundling it into an Invoice (see
   *  `JobOrder.invoiceId`) rather than paid individually — lets Staff trace which invoice covered it. */
  invoiceNo?: string;
}

/**
 * Admin's Pending Commissions row — one per Job Order whose bill and payment proof have been
 * verified but whose commission payment hasn't been confirmed by Staff yet — deliberately
 * independent of whether the procuring entity has paid the company (paymentVerifiedAt).
 * `commissionRate` is derived (`commissionValue / newTotal * 100` — the same base the wizard's own
 * Sales Commission percentage is calculated against, see JobOrderWizardContext) purely for display;
 * `profit` (the Overall Profit base, shown alongside for context) and `calculatedCommission`
 * (`JobOrder.commissionValue`) are both real, already-persisted figures — `calculatedCommission` is
 * shown directly rather than re-derived from the rounded rate, so it never drifts from what will
 * actually be paid out. Covers two stages in one table: `awaitingStaffConfirmation: false` means
 * Upload/Reject are still live (Admin hasn't paid yet); `true` means Admin already paid and
 * uploaded a receipt, so those actions are replaced with a read-only "awaiting Staff" indicator
 * until Staff confirms and the row leaves for History.
 */
export interface AdminPendingCommission {
  id: string;
  staffName: string;
  jobOrderNo: string;
  profit: number;
  /** Percentage, e.g. 10 for 10% — rounded, for display only. */
  commissionRate: number;
  calculatedCommission: number;
  awaitingStaffConfirmation: boolean;
}

/** Admin's Commission History row — already paid out to staff and confirmed by them. Carries the
 *  same receipt Admin uploaded at payout time (`JobOrder.commissionPaymentProof`), so it stays
 *  reviewable after the fact, not just while it was Pending. */
export interface AdminCommissionHistoryRecord {
  id: string;
  staffName: string;
  jobOrderNo: string;
  profit: number;
  commissionPaid: number;
  /** Formatted "YYYY-MM-DD HH:MM" — the receipt's real upload timestamp, see `formatDateTime`. */
  uploadedAt: string;
  receiptFileName: string;
  receiptFileType: string;
  receiptUrl: string;
  /** Set only when this commission was settled by bundling it into an Invoice (see
   *  `JobOrder.invoiceId`) rather than paid individually — lets Admin trace which invoice covered it. */
  invoiceNo?: string;
}

/**
 * Staff's Pending Commissions row — mirrors `AdminPendingCommission`'s own two stages so Staff can
 * see the full lifecycle, not just the final step: `uploadedAt`/`paymentProof*` are all null while
 * awaiting Admin's payment (nothing to confirm yet), and populated once Admin pays and uploads a
 * receipt — only then is PATCH confirm-commission-payment actually reachable.
 */
export interface StaffPendingCommission {
  id: string;
  jobOrderNo: string;
  profit: number;
  /** Percentage, e.g. 10 for 10% — rounded, for display only. */
  commissionRate: number;
  calculatedCommission: number;
  /** Formatted "YYYY-MM-DD HH:MM" (see `formatDateTime`) — null until Admin pays. */
  uploadedAt: string | null;
  paymentProofName: string | null;
  paymentProofType: string | null;
  /** Signed, short-lived S3 URL for Admin's uploaded receipt — null until Admin pays. */
  paymentProofUrl: string | null;
}
