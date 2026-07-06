"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { formatAmount, formatLKR } from "@/lib/utils/currency";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import type { PriceScheduleLineItem } from "@/shared/types/tender.types";

const INITIAL_ITEMS: PriceScheduleLineItem[] = [
  { id: "1", item: "Surgical gloves, nitrile, box 100", qty: 500, unitPrice: 1250 },
  { id: "2", item: "Examination table, adjustable", qty: 12, unitPrice: 84_000 },
  { id: "3", item: "IV stands, stainless steel", qty: 40, unitPrice: 6500 },
];

export function LineItemsTable() {
  const [items, setItems] = useState<PriceScheduleLineItem[]>(INITIAL_ITEMS);
  // Tracks which row's item-description is currently in edit mode.
  // Qty/Unit Price are always-editable inputs, so they don't need this.
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateItem = <K extends keyof PriceScheduleLineItem>(
    id: string,
    key: K,
    value: PriceScheduleLineItem[K],
  ) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id));
  };

  const addRow = () => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, item: "", qty: 1, unitPrice: 0 }]);
    setEditingId(id);
  };

  // Recomputed on every render from current item state — always in sync
  // with whatever qty/unit price values are currently in the inputs below.
  const totals = items.reduce(
    (acc, row) => {
      const { vat, subTotal } = calculateLineItemTotals(row.qty, row.unitPrice);
      return { vat: acc.vat + vat, subTotal: acc.subTotal + subTotal };
    },
    { vat: 0, subTotal: 0 },
  );

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Line Items (AI-extracted, editable)
        </p>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-none border border-border px-3 py-1.5 text-sm text-ink hover:bg-active/5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Row
        </button>
      </div>

      {/* Scrollable on small screens per AI_INSTRUCTIONS.md §C */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">Item Description</th>
              <th className="px-3 py-2 font-semibold">Qty</th>
              <th className="px-3 py-2 font-semibold">Unit Price</th>
              <th className="px-3 py-2 font-semibold">VAT (15%)</th>
              <th className="px-3 py-2 font-semibold">Sub Total</th>
              <th className="py-2 pl-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const { vat, subTotal } = calculateLineItemTotals(row.qty, row.unitPrice);
              const isEditingItem = editingId === row.id;

              return (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 text-ink">
                    {isEditingItem ? (
                      <input
                        autoFocus
                        type="text"
                        value={row.item}
                        onChange={(e) => updateItem(row.id, "item", e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="w-full rounded-none border border-border bg-surface px-2 py-1"
                      />
                    ) : (
                      row.item || <span className="text-muted">Untitled item</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={row.qty}
                      onChange={(e) => updateItem(row.id, "qty", Number(e.target.value))}
                      className="w-20 rounded-none border border-border bg-surface px-2 py-1 text-ink"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={row.unitPrice}
                      onChange={(e) => updateItem(row.id, "unitPrice", Number(e.target.value))}
                      className="w-28 rounded-none border border-border bg-surface px-2 py-1 text-ink"
                    />
                  </td>
                  <td className="px-3 py-2 text-ink">{formatAmount(vat)}</td>
                  <td className="px-3 py-2 font-medium text-ink">{formatAmount(subTotal)}</td>
                  <td className="py-2 pl-3">
                    <div className="flex items-center gap-2 text-muted">
                      <button
                        type="button"
                        aria-label="Edit item description"
                        onClick={() => setEditingId(row.id)}
                        className="hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete row"
                        onClick={() => deleteItem(row.id)}
                        className="hover:text-ink"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-ink">
              <td className="py-2 pr-3">TOTALS</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2" />
              <td className="px-3 py-2">{formatLKR(Math.round(totals.vat))}</td>
              <td className="px-3 py-2">{formatLKR(Math.round(totals.subTotal))}</td>
              <td className="py-2 pl-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
