import type { PendingCommission } from "@/shared/types/commission.types";

// Job Order and Commissions Pending/History are real data now (see the respective page.tsx
// files) — this one export remains because Staff's Generate Invoice page still mocks its
// "pending commissions to invoice" picker.
// TODO: replace with real data once Invoices is wired up for real.
export const pendingCommissions: PendingCommission[] = [
  { id: "1", jobOrderNo: "JO-2026-0142", amount: 18_500 },
  { id: "2", jobOrderNo: "JO-2026-0139", amount: 24_000 },
  { id: "3", jobOrderNo: "JO-2026-0135", amount: 12_750 },
  { id: "4", jobOrderNo: "JO-2026-0128", amount: 14_750 },
];
