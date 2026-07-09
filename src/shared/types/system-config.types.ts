export interface SystemConfig {
  companyName: string;
  /** 0-100 — applied to Sub Total when computing tender line-item VAT (AI_INSTRUCTIONS.md Workflow A). */
  vatPercentage: number;
  logoFileName?: string;
  /** Hex color driving the global sidebar background — see ThemeProvider. */
  themeColor: string;
  /** Grace period, in days, after a bill is generated before Admin's Pending Job Orders table marks it "Due". */
  paymentDueDays: number;
}
