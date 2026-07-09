import { T } from "@/components/features/i18n/T";
import { AdminInvoiceHistoryTable } from "@/components/features/invoices/AdminInvoiceHistoryTable";

export default function AdminInvoiceHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="invoices.historyHeadingAdmin" />
      </h1>

      <AdminInvoiceHistoryTable />
    </div>
  );
}
