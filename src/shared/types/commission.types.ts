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
