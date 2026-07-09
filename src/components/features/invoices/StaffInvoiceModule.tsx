"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Toggle } from "@/components/ui/Toggle";
import { useInvoiceStore } from "@/context/InvoiceStoreContext";
import { useTranslation } from "@/context/LanguageContext";
import { staffOptions } from "@/lib/mock/jobOrders.mock";
import { formatLKR } from "@/lib/utils/currency";
import type { PendingCommission } from "@/shared/types/commission.types";
import type { InvoiceLineItem, InvoiceRequest } from "@/shared/types/invoice.types";
import type { OtherExpenseRecord } from "@/shared/types/other-expense.types";

// Stand-in for the signed-in Staff user — no auth/session yet (AGENTS.md UI-only mock phase),
// same convention JobOrderWizardContext already uses for "this staff member".
const CURRENT_STAFF_NAME = staffOptions[0].name;

interface StaffInvoiceModuleProps {
  initialCommissions: PendingCommission[];
  initialExpenses: OtherExpenseRecord[];
}

export function StaffInvoiceModule({ initialCommissions, initialExpenses }: StaffInvoiceModuleProps) {
  const { t } = useTranslation();
  const { invoices, submitInvoice } = useInvoiceStore();
  const [commissions, setCommissions] = useState(initialCommissions);
  const [expenses, setExpenses] = useState(initialExpenses.filter((expense) => expense.status === "Pending"));
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [lastSubmittedNo, setLastSubmittedNo] = useState<string | null>(null);

  const toggleCommission = (id: string, checked: boolean) =>
    setSelectedCommissionIds((prev) => (checked ? [...prev, id] : prev.filter((cid) => cid !== id)));

  const toggleExpense = (id: string, checked: boolean) =>
    setSelectedExpenseIds((prev) => (checked ? [...prev, id] : prev.filter((eid) => eid !== id)));

  const selectedItems: InvoiceLineItem[] = useMemo(() => {
    const commissionItems: InvoiceLineItem[] = commissions
      .filter((c) => selectedCommissionIds.includes(c.id))
      .map((c) => ({
        id: c.id,
        type: "commission",
        label: t("invoices.commissionLabel", { jobOrderNo: c.jobOrderNo }),
        amount: c.amount,
      }));

    const expenseItems: InvoiceLineItem[] = expenses
      .filter((e) => selectedExpenseIds.includes(e.id))
      .map((e) => ({ id: e.id, type: "expense", label: e.description, amount: e.amount }));

    return [...commissionItems, ...expenseItems];
  }, [commissions, expenses, selectedCommissionIds, selectedExpenseIds, t]);

  const total = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const canGenerate = selectedItems.length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;

    const invoiceNo = `INV-${new Date().getFullYear()}-${String(invoices.length + 100).padStart(4, "0")}`;
    const invoice: InvoiceRequest = {
      id: crypto.randomUUID(),
      invoiceNo,
      submittedBy: CURRENT_STAFF_NAME,
      submittedDate: new Date().toISOString().slice(0, 10),
      items: selectedItems,
      total,
      status: "Pending Review",
      verified: false,
    };

    // TODO: POST /api/invoices once that route exists — UI-only mock phase (AGENTS.md).
    submitInvoice(invoice);

    // Mock-only: the selected commissions/expenses leave this staff member's
    // pending pools now that they're bundled into a submitted invoice.
    setCommissions((prev) => prev.filter((c) => !selectedCommissionIds.includes(c.id)));
    setExpenses((prev) => prev.filter((e) => !selectedExpenseIds.includes(e.id)));
    setSelectedCommissionIds([]);
    setSelectedExpenseIds([]);
    setLastSubmittedNo(invoiceNo);
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
                    <span className="flex flex-col">
                      <span>{expense.description}</span>
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
        {lastSubmittedNo && (
          <span className="text-xs text-muted">{t("invoices.submitted", { invoiceNo: lastSubmittedNo })}</span>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("invoices.generateButton")}
        </button>
      </div>
    </div>
  );
}
