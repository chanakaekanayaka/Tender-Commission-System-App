import type { SystemConfig } from "@/shared/types/system-config.types";

// TODO: replace with a real fetch (GET /api/system-config) once that route exists.
export const defaultSystemConfig: SystemConfig = {
  companyName: "TenderCMS (Pvt) Ltd.",
  isVatRegistered: true,
  vatPercentage: 15,
  themeColor: "#111827",
  paymentDueDays: 14,
};
