import { T } from "@/components/features/i18n/T";
import { StaffInvoiceModule } from "@/components/features/invoices/StaffInvoiceModule";
import { pendingCommissions } from "@/lib/mock/commissions.mock";
import { otherExpenses } from "@/lib/mock/otherExpenses.mock";

export default function StaffGenerateInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="invoices.generateHeading" />
        </h1>
      </div>

      <StaffInvoiceModule initialCommissions={pendingCommissions} initialExpenses={otherExpenses} />
    </div>
  );
}
