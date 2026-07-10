import { T } from "@/components/features/i18n/T";
import { AdminExpenseHistory } from "@/components/features/other-expenses/AdminExpenseHistory";
import { adminExpenseHistory } from "@/lib/mock/otherExpenses.mock";

export default function AdminExpenseHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="otherExpenses.historyHeading" />
      </h1>

      <AdminExpenseHistory data={adminExpenseHistory} />
    </div>
  );
}
