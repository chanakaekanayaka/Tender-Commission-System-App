"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { StaffExpensePendingRecord } from "@/shared/types/other-expense.types";

interface StaffExpensePendingTableProps {
  data: StaffExpensePendingRecord[];
}

/** Staff's own submitted expenses still awaiting Admin's Approve/Reject decision — read-only. */
export function StaffExpensePendingTable({ data }: StaffExpensePendingTableProps) {
  const { t } = useTranslation();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewRow = data.find((row) => row.id === previewId) ?? null;

  return (
    <div>
      <DataTable
        columns={[
          { id: "description", header: t("otherExpenses.description"), cell: (row) => row.description },
          { id: "date", header: t("otherExpenses.date"), cell: (row) => row.date },
          { id: "amount", header: t("otherExpenses.amount"), cell: (row) => formatLKR(row.amount) },
          {
            id: "receipt",
            header: t("otherExpenses.receipt"),
            cell: (row) => (
              <JobOrderDocumentCell documentName={row.receiptFileName} onPreview={() => setPreviewId(row.id)} />
            ),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("otherExpenses.pending")} tone="amber" />,
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("otherExpenses.noPending")}
      />

      <DocumentPreviewModal
        open={previewRow !== null}
        onClose={() => setPreviewId(null)}
        fileName={previewRow?.receiptFileName}
        fileType={previewRow?.receiptFileType}
        url={previewRow?.receiptUrl}
      />
    </div>
  );
}
