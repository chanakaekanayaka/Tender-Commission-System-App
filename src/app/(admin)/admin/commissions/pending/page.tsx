import { T } from "@/components/features/i18n/T";
import { AdminPendingCommissions } from "@/components/features/commissions/AdminPendingCommissions";
import { adminPendingCommissions } from "@/lib/mock/commissions.mock";

export default function AdminCommissionsPendingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.pendingHeading" />
      </h1>

      <AdminPendingCommissions data={adminPendingCommissions} />
    </div>
  );
}
