import { InvoiceModel } from "@/lib/db/models/Invoice.model";

/** Next invoiceNo (INV-{year}-####) is derived from whatever's actually in the Invoices collection
 *  right now (highest existing number for the current year + 1) — same self-healing reasoning as
 *  Job Order numbers (src/lib/db/jobOrders.ts): never a separately persisted counter that can go
 *  stale if records are ever deleted directly in the database. */
export async function nextInvoiceNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const highest = await InvoiceModel.findOne({ invoiceNo: { $regex: `^${prefix}` } })
    .sort({ invoiceNo: -1 })
    .select("invoiceNo")
    .lean<{ invoiceNo: string }>();

  const nextSeq = highest ? Number(highest.invoiceNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}
