"use client";

import { Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { ReceiptPreviewModal } from "@/components/features/job-orders/ReceiptPreviewModal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { ReceiptItem } from "@/shared/types/job-order.types";

interface ReceiptsListProps {
  receipts: ReceiptItem[];
  onAmountChange: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
}

/** Receipt Details list — each row is an uploaded file with an editable amount, mirroring `OtherExpensesSection`'s row layout. The filename doubles as a preview trigger so Admin/Staff can double-check the right document was attached. */
export function ReceiptsList({ receipts, onAmountChange, onRemove }: ReceiptsListProps) {
  const { t } = useTranslation();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const total = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const previewReceipt = receipts.find((receipt) => receipt.id === previewId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {t("jobOrderCreate.receiptDetailsHeading")}
      </p>

      {receipts.length === 0 ? (
        <p className="text-sm text-muted">{t("jobOrderCreate.noReceiptsUploaded")}</p>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
              <div className="block text-sm">
                <span className="text-muted">{t("jobOrderCreate.receiptFileLabel")}</span>
                <button
                  type="button"
                  onClick={() => setPreviewId(receipt.id)}
                  aria-label={t("jobOrderCreate.previewReceipt")}
                  title={receipt.fileName}
                  className="mt-1 flex w-full items-center gap-2 border border-transparent px-3 py-2 text-ink hover:text-active"
                >
                  <span className="truncate">{receipt.fileName}</span>
                  <Eye className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                </button>
              </div>
              <FormField
                label={t("jobOrderCreate.expenseAmount")}
                type="number"
                min={0}
                value={receipt.amount}
                onChange={(v) => onAmountChange(receipt.id, Math.max(0, Number(v) || 0))}
                suffix="Rs"
              />
              <button
                type="button"
                onClick={() => onRemove(receipt.id)}
                aria-label={t("jobOrderCreate.removeReceipt")}
                className="justify-self-start rounded-none border border-border p-2 text-muted hover:text-ink"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm font-medium text-ink">
        {t("jobOrderCreate.receiptsSubtotal")}: {formatLKR(Math.round(total))}
      </p>

      <ReceiptPreviewModal receipt={previewReceipt} onClose={() => setPreviewId(null)} />
    </div>
  );
}
