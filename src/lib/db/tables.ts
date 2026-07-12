/** Table names come from env vars so the same code works across dev/staging/prod stacks without edits. Set these once real AWS credentials + tables exist. */
export const TABLES = {
  USERS: process.env.USERS_TABLE ?? "Users",
  TENDERS: process.env.TENDERS_TABLE ?? "Tenders",
  JOB_ORDERS: process.env.JOB_ORDERS_TABLE ?? "JobOrders",
  INVOICES: process.env.INVOICES_TABLE ?? "Invoices",
  COMMISSIONS: process.env.COMMISSIONS_TABLE ?? "Commissions",
  ITEMS: process.env.ITEMS_TABLE ?? "Items",
  MARKET_ANALYSIS: process.env.MARKET_ANALYSIS_TABLE ?? "MarketAnalysis",
  OTHER_EXPENSES: process.env.OTHER_EXPENSES_TABLE ?? "OtherExpenses",
  SYSTEM_CONFIG: process.env.SYSTEM_CONFIG_TABLE ?? "SystemConfig",
} as const;

/** GSI names as provisioned on each table — keep in sync with the CDK/console table definitions. */
export const INDEXES = {
  USERS_BY_ROLE: "byRole",
  TENDERS_BY_PROCUREMENT_NO: "byProcurementNo",
  /** PK userId, SK status — staff's own active/pending job orders. */
  JOB_ORDERS_BY_USER: "byUser",
  /** PK status, SK billGeneratedDate — admin's active/pending/completed lists. */
  JOB_ORDERS_BY_STATUS: "byStatus",
  JOB_ORDERS_BY_PROCUREMENT: "byProcurement",
  INVOICES_BY_STATUS: "byStatus",
  INVOICES_BY_SUBMITTER: "bySubmitter",
  COMMISSIONS_BY_STAFF_STATUS: "byStaffAndStatus",
  COMMISSIONS_BY_STATUS: "byStatus",
  OTHER_EXPENSES_BY_STAFF: "byStaff",
  OTHER_EXPENSES_BY_JOB_ORDER: "byJobOrder",
  OTHER_EXPENSES_BY_STATUS: "byStatus",
} as const;

/** SystemConfig is a single app-wide record, not a per-entity list — always read/write this fixed key. */
export const SYSTEM_CONFIG_KEY = "GLOBAL";
