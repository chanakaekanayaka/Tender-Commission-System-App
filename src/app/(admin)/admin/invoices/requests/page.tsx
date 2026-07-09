import { T } from "@/components/features/i18n/T";
import { AdminInvoiceModule } from "@/components/features/invoices/AdminInvoiceModule";

export default function AdminInvoiceRequestsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="invoices.requestsHeading" />
      </h1>

      <AdminInvoiceModule />
    </div>
  );
}
