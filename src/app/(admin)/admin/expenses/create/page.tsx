import { T } from "@/components/features/i18n/T";
import { AdminExpenseForm } from "@/components/features/other-expenses/AdminExpenseForm";
import { activeJobOrders } from "@/lib/mock/activeJobOrders.mock";
import { jobOrderHistory } from "@/lib/mock/jobOrderHistory.mock";

export default function AdminExpenseCreatePage() {
  const jobOrderNos = Array.from(
    new Set([...activeJobOrders, ...jobOrderHistory].map((jo) => jo.jobOrderNo)),
  ).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="otherExpenses.createHeading" />
      </h1>

      <AdminExpenseForm jobOrderNos={jobOrderNos} />
    </div>
  );
}
