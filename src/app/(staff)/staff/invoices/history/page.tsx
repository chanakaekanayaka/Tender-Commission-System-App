import { T } from "@/components/features/i18n/T";
import { StaffInvoiceHistoryTable } from "@/components/features/invoices/StaffInvoiceHistoryTable";

export default function StaffInvoiceHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="invoices.historyHeadingStaff" />
      </h1>

      <StaffInvoiceHistoryTable />
    </div>
  );
}
