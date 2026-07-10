import { T } from "@/components/features/i18n/T";
import { AdminCommissionHistory } from "@/components/features/commissions/AdminCommissionHistory";
import { adminCommissionHistory } from "@/lib/mock/commissions.mock";

export default function AdminCommissionHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.historyHeading" />
      </h1>

      <AdminCommissionHistory data={adminCommissionHistory} />
    </div>
  );
}
