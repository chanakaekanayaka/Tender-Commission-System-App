"use client";

import { Eye, Pencil, Search } from "lucide-react";
import { useState } from "react";
import { formatLKR } from "@/lib/utils/currency";
import type { PriceScheduleSummary } from "@/shared/types/tender.types";

interface PriceScheduleHistoryTableProps {
  data: PriceScheduleSummary[];
}

export function PriceScheduleHistoryTable({ data }: PriceScheduleHistoryTableProps) {
  // Only the search box needs client state — the table itself would be static
  // markup if not for filtering it reactively against that input.
  const [query, setQuery] = useState("");

  const filtered = data.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      row.procurementNo.toLowerCase().includes(q) || row.entity.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="relative mb-4 max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Procurement No or Entity"
          className="w-full rounded-none border border-border bg-surface py-2 pr-3 pl-8 text-sm text-ink placeholder:text-muted"
        />
      </div>

      {/* Scrollable on small screens per AI_INSTRUCTIONS.md §C */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">Procurement No</th>
              <th className="px-3 py-2 font-semibold">Entity</th>
              <th className="px-3 py-2 font-semibold">Closing Date</th>
              <th className="px-3 py-2 font-semibold">Total Value</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="py-2 pl-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 font-medium text-ink">{row.procurementNo}</td>
                <td className="px-3 py-2 text-ink">{row.entity}</td>
                <td className="px-3 py-2 text-muted">{row.closingDate}</td>
                <td className="px-3 py-2 text-ink">{formatLKR(row.totalValue)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-none px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "Completed"
                        ? "bg-active text-active-ink"
                        : "border border-border text-muted"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-2 pl-3">
                  <div className="flex items-center gap-2 text-muted">
                    <button type="button" aria-label="View" className="hover:text-ink">
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" aria-label="Edit" className="hover:text-ink">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  No price schedules match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
