"use client";

import { useState } from "react";
import { T } from "@/components/features/i18n/T";
import { JobOrderDetailModal } from "@/components/features/job-orders/JobOrderDetailModal";
import { UploadButton } from "@/components/features/dashboard/UploadButton";
import type { PendingOrderRow } from "@/types/dashboard";

interface PendingOrdersTableProps {
  orders: PendingOrderRow[];
}

/** Job Number opens JobOrderDetailModal's read-only drill-down; UploadButton stays a separate action. */
export function PendingOrdersTable({ orders }: PendingOrdersTableProps) {
  const [selectedJobNumber, setSelectedJobNumber] = useState<string | null>(null);

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
                <td className="py-3 pr-4">
                  <button
                    type="button"
                    onClick={() => setSelectedJobNumber(order.jobNumber)}
                    className="text-ink underline decoration-border underline-offset-2 hover:text-active"
                  >
                    {order.jobNumber}
                  </button>
                </td>
                <td className="py-3">
                  <UploadButton jobNumber={order.jobNumber} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <JobOrderDetailModal jobNumber={selectedJobNumber} onClose={() => setSelectedJobNumber(null)} />
    </div>
  );
}
