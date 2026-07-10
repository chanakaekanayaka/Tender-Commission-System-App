import type {
  AdminCommissionHistoryRecord,
  AdminPendingCommission,
  CommissionHistoryRecord,
  PendingCommission,
} from "@/shared/types/commission.types";

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

export const adminPendingCommissions: AdminPendingCommission[] = [
  { id: "1", staffName: "Nimal Perera", jobOrderNo: "JO-2026-0142", profit: 185_000, commissionRate: 10 },
  { id: "2", staffName: "Kamala Silva", jobOrderNo: "JO-2026-0139", profit: 240_000, commissionRate: 10 },
  { id: "3", staffName: "Sunil Fernando", jobOrderNo: "JO-2026-0135", profit: 127_500, commissionRate: 10 },
  { id: "4", staffName: "Nimal Perera", jobOrderNo: "JO-2026-0128", profit: 147_500, commissionRate: 10 },
];

export const adminCommissionHistory: AdminCommissionHistoryRecord[] = [
  {
    id: "1",
    staffName: "Kamala Silva",
    jobOrderNo: "JO-2026-0110",
    profit: 210_000,
    commissionPaid: 21_000,
    paymentDate: "2026-06-12",
  },
  {
    id: "2",
    staffName: "Sunil Fernando",
    jobOrderNo: "JO-2026-0104",
    profit: 164_000,
    commissionPaid: 16_400,
    paymentDate: "2026-06-05",
  },
  {
    id: "3",
    staffName: "Nimal Perera",
    jobOrderNo: "JO-2026-0098",
    profit: 325_000,
    commissionPaid: 32_500,
    paymentDate: "2026-05-28",
  },
  {
    id: "4",
    staffName: "Kamala Silva",
    jobOrderNo: "JO-2026-0091",
    profit: 98_000,
    commissionPaid: 9_800,
    paymentDate: "2026-05-19",
  },
  {
    id: "5",
    staffName: "Sunil Fernando",
    jobOrderNo: "JO-2026-0085",
    profit: 273_000,
    commissionPaid: 27_300,
    paymentDate: "2026-05-10",
  },
];
