import { T } from "@/components/features/i18n/T";
import { UploadButton } from "@/components/features/dashboard/UploadButton";
import type { PendingOrderRow } from "@/types/dashboard";

interface PendingOrdersTableProps {
  orders: PendingOrderRow[];
}

/** Server Component — static table shell; UploadButton and <T/> are the only client pieces. */
export function PendingOrdersTable({ orders }: PendingOrdersTableProps) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <h2 className="mb-3 font-semibold text-ink">
        <T k="dashboard.pendingOrders" values={{ count: orders.length }} />
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold tracking-wide text-muted uppercase">
              <th className="py-2 pr-4">
                <T k="dashboard.jobNumber" />
              </th>
              <th className="py-2">
                <T k="dashboard.uploadBillCopy" />
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 text-ink">{order.jobNumber}</td>
                <td className="py-3">
                  <UploadButton jobNumber={order.jobNumber} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
