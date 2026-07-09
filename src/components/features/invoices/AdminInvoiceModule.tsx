"use client";

import { useRef, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceDetailModal } from "@/components/features/invoices/InvoiceDetailModal";
import { useInvoiceStore } from "@/context/InvoiceStoreContext";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

/** Admin's Invoice Requests — every Staff-submitted invoice still awaiting review/payment. Verify is a cosmetic acknowledgment; Upload is what actually flips status to Paid. */
export function AdminInvoiceModule() {
  const { t } = useTranslation();
  const { invoices, verifyInvoice, markPaid } = useInvoiceStore();
  const [query, setQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingReview = invoices.filter((invoice) => invoice.status === "Pending Review");

  const filtered = pendingReview.filter((invoice) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [invoice.invoiceNo, invoice.submittedBy].join(" ").toLowerCase().includes(q);
  });

  const viewingInvoice = invoices.find((invoice) => invoice.id === viewingId) ?? null;

  const handleUploadClick = (id: string) => {
    setUploadingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChosen = (file: File | undefined) => {
    if (file && uploadingId) markPaid(uploadingId, file.name);
    setUploadingId(null);
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("invoices.searchPlaceholder")} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
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
            cell: (row) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge label={t("invoices.pendingReview")} tone="amber" />
                {row.verified && <StatusBadge label={t("invoices.verified")} tone="green" />}
              </div>
            ),
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
                  onClick={() => verifyInvoice(row.id)}
                  disabled={row.verified}
                  className="text-xs font-medium text-ink underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                >
                  {row.verified ? t("invoices.verified") : t("invoices.verify")}
                </button>
                <button
                  type="button"
                  onClick={() => handleUploadClick(row.id)}
                  className="text-xs font-medium text-ink underline"
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
    </div>
  );
}
