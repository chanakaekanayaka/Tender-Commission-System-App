"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { PendingCommission } from "@/shared/types/commission.types";
import type { StaffExpensePendingRecord } from "@/shared/types/other-expense.types";

interface InvoicePreviewRow {
  id: string;
  label: string;
  amount: number;
}

interface StaffInvoiceModuleProps {
  commissions: PendingCommission[];
  expenses: StaffExpensePendingRecord[];
}

/** Staff bundling their own pending commissions and/or pending other-expenses into one invoice —
 *  real POST /api/invoices on Generate. Both lists are exactly what Job Order Commissions Pending
 *  and Other Expenses Pending already show (minus anything already bundled into another invoice —
 *  see invoiceId), so nothing here can be selected twice across two different invoices. */
export function StaffInvoiceModule({ commissions, expenses }: StaffInvoiceModuleProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const toggleCommission = (id: string, checked: boolean) =>
    setSelectedCommissionIds((prev) => (checked ? [...prev, id] : prev.filter((cid) => cid !== id)));

  const toggleExpense = (id: string, checked: boolean) =>
    setSelectedExpenseIds((prev) => (checked ? [...prev, id] : prev.filter((eid) => eid !== id)));

  const selectedItems: InvoicePreviewRow[] = useMemo(() => {
    const commissionItems: InvoicePreviewRow[] = commissions
      .filter((c) => selectedCommissionIds.includes(c.id))
      .map((c) => ({ id: c.id, label: t("invoices.commissionLabel", { jobOrderNo: c.jobOrderNo }), amount: c.amount }));

    const expenseItems: InvoicePreviewRow[] = expenses
      .filter((e) => selectedExpenseIds.includes(e.id))
      .map((e) => ({ id: e.id, label: e.description, amount: e.amount }));

    return [...commissionItems, ...expenseItems];
  }, [commissions, expenses, selectedCommissionIds, selectedExpenseIds, t]);

  const total = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const canGenerate = selectedItems.length > 0 && !isGenerating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionJobOrderIds: selectedCommissionIds, expenseIds: selectedExpenseIds }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to generate invoice.");
      }
      router.push("/staff/invoices/history");
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to generate invoice.", variant: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("invoices.selectCommissions")}>
          {commissions.length === 0 ? (
            <p className="text-sm text-muted">{t("invoices.noCommissions")}</p>
          ) : (
            <div className="space-y-2">
              {commissions.map((commission) => (
                <Toggle
                  key={commission.id}
                  checked={selectedCommissionIds.includes(commission.id)}
                  onChange={(checked) => toggleCommission(commission.id, checked)}
                  label={
                    <span className="flex flex-col">
                      <span>{commission.jobOrderNo}</span>
                      <span className="text-xs text-muted">{formatLKR(commission.amount)}</span>
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </Card>

        <Card title={t("invoices.selectExpenses")}>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted">{t("invoices.noExpenses")}</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <Toggle
                  key={expense.id}
                  checked={selectedExpenseIds.includes(expense.id)}
                  onChange={(checked) => toggleExpense(expense.id, checked)}
                  label={
                    <span className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        {expense.description}
                        <StatusBadge label={t("invoices.claimable")} tone="blue" />
                      </span>
                      <span className="text-xs text-muted">{formatLKR(expense.amount)}</span>
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title={t("invoices.summaryHeading")}>
        <DataTable
          columns={[
            { id: "label", header: t("invoices.lineItemLabel"), cell: (row) => row.label },
            { id: "amount", header: t("invoices.lineItemAmount"), cell: (row) => formatLKR(row.amount) },
          ]}
          data={selectedItems}
          rowKey={(row) => row.id}
          emptyMessage={t("invoices.noItemsSelected")}
        />
        <p className="mt-3 text-right text-sm font-semibold text-ink">
          {t("invoices.total")}: {formatLKR(total)}
        </p>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? t("invoices.generating") : t("invoices.generateButton")}
        </button>
      </div>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
