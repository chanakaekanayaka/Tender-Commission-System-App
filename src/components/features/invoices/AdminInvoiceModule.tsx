"use client";

import { useRef, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { InvoiceDetailModal } from "@/components/features/invoices/InvoiceDetailModal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { InvoiceRequest } from "@/shared/types/invoice.types";

interface AdminInvoiceModuleProps {
  data: InvoiceRequest[];
}

/** Admin's Invoice Requests — every Staff-submitted invoice still awaiting payment. Uploading the
 *  payment bill is the one real action: it settles the whole invoice (and cascades to every
 *  commission/expense it bundled) in one step, moving the row into History. */
export function AdminInvoiceModule({ data }: AdminInvoiceModuleProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(data);
  const [query, setQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = rows.filter((invoice) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [invoice.invoiceNo, invoice.submittedBy].join(" ").toLowerCase().includes(q);
  });

  const viewingInvoice = rows.find((invoice) => invoice.id === viewingId) ?? null;

  const handleUploadClick = (id: string) => {
    setUploadingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (file: File | undefined) => {
    const id = uploadingId;
    setUploadingId(null);
    if (!file || !id) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/invoices/${id}/pay`, { method: "PATCH", body: formData });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to mark invoice as paid.");
      }
      setRows((prev) => prev.filter((invoice) => invoice.id !== id));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to mark invoice as paid.", variant: "error" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("invoices.searchPlaceholder")} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileChosen(e.target.files?.[0])}
      />

      <DataTable
        columns={[
          { id: "invoiceNo", header: t("invoices.invoiceNo"), cell: (row) => row.invoiceNo },
          { id: "submittedBy", header: t("invoices.submittedBy"), cell: (row) => row.submittedBy },
          { id: "submittedDate", header: t("invoices.submittedDate"), cell: (row) => row.submittedDate },
          { id: "total", header: t("invoices.total"), cell: (row) => formatLKR(row.total) },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("invoices.pendingReview")} tone="amber" />,
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) => (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setViewingId(row.id)}
                  className="text-xs font-medium text-ink underline"
                >
                  {t("common.view")}
                </button>
                <button
                  type="button"
                  onClick={() => handleUploadClick(row.id)}
                  disabled={uploadingId === row.id}
                  className="text-xs font-medium text-green-700 underline hover:text-green-800 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                >
                  {t("invoices.uploadPaymentBill")}
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("invoices.noRequests")}
      />

      <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingId(null)} />

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
