import type { CommissionHistoryRecord, PendingCommission } from "@/shared/types/commission.types";

// TODO: replace with a real fetch (GET /api/commissions) once that route exists.

export const pendingCommissions: PendingCommission[] = [
  { id: "1", jobOrderNo: "JO-2026-0142", amount: 18_500 },
  { id: "2", jobOrderNo: "JO-2026-0139", amount: 24_000 },
  { id: "3", jobOrderNo: "JO-2026-0135", amount: 12_750 },
  { id: "4", jobOrderNo: "JO-2026-0128", amount: 14_750 },
];

export const commissionHistory: CommissionHistoryRecord[] = [
  { id: "1", jobOrderNo: "JO-2026-0110", amount: 21_000, paymentRefNo: "PAY-2026-0087" },
  { id: "2", jobOrderNo: "JO-2026-0104", amount: 16_400, paymentRefNo: "PAY-2026-0081" },
  { id: "3", jobOrderNo: "JO-2026-0098", amount: 32_500, paymentRefNo: "PAY-2026-0076" },
  { id: "4", jobOrderNo: "JO-2026-0091", amount: 9_800, paymentRefNo: "PAY-2026-0069" },
  { id: "5", jobOrderNo: "JO-2026-0085", amount: 27_300, paymentRefNo: "PAY-2026-0061" },
];
