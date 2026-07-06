"use client";

import { useState } from "react";
import { formatCompactLKR, formatLKR } from "@/lib/utils/currency";
import type { MonthlyPerformance } from "@/types/dashboard";

const BAR_WIDTH = 40;
const GAP = 16;
const COLUMN = BAR_WIDTH + GAP;
const PLOT_HEIGHT = 208; // px — the h-64 (256px) card area minus space reserved for month labels

interface PerformanceChartProps {
  data: MonthlyPerformance[];
  highlightMonth?: string;
}

export function PerformanceChart({ data, highlightMonth }: PerformanceChartProps) {
  const [showSales, setShowSales] = useState(true);
  const [showTarget, setShowTarget] = useState(false);

  const rawMax = Math.max(...data.flatMap((d) => [d.sales, d.target]));
  const roundedMax = Math.max(100_000, Math.ceil(rawMax / 100_000) * 100_000);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((fraction) => Math.round(roundedMax * fraction));

  const chartWidth = data.length * COLUMN;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">Month-by-Month Company Performance</h2>

        <div className="inline-flex overflow-hidden rounded-md border border-border text-xs font-medium">
          <button
            type="button"
            onClick={() => setShowSales((v) => !v)}
            aria-pressed={showSales}
            className={`px-3 py-1.5 transition-colors ${
              showSales ? "bg-active text-active-ink" : "text-muted hover:bg-active/5"
            }`}
          >
            Sales
          </button>
          <button
            type="button"
            onClick={() => setShowTarget((v) => !v)}
            aria-pressed={showTarget}
            className={`border-l border-border px-3 py-1.5 transition-colors ${
              showTarget ? "bg-active text-active-ink" : "text-muted hover:bg-active/5"
            }`}
          >
            Target Line
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-start">
        {/* Y-axis (LKR) — stays fixed while the plot area scrolls */}
        <div
          className="flex w-12 shrink-0 flex-col justify-between text-right text-[11px] text-muted"
          style={{ height: PLOT_HEIGHT }}
        >
          {ticks.map((tick) => (
            <span key={tick}>{formatCompactLKR(tick).replace("Rs ", "")}</span>
          ))}
        </div>

        {/* Scrollable plot area */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="relative" style={{ width: chartWidth, height: PLOT_HEIGHT }}>
            {/* gridlines */}
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute right-0 left-0 border-t border-dashed border-border"
                style={{ top: PLOT_HEIGHT - (tick / roundedMax) * PLOT_HEIGHT }}
              />
            ))}

            {/* target line overlay */}
            {showTarget && (
              <svg
                className="absolute inset-0"
                width={chartWidth}
                height={PLOT_HEIGHT}
                aria-hidden
              >
                <polyline
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  className="stroke-amber-500"
                  points={data
                    .map((d, i) => {
                      const x = i * COLUMN + BAR_WIDTH / 2;
                      const y = PLOT_HEIGHT - (d.target / roundedMax) * PLOT_HEIGHT;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
              </svg>
            )}

            {/* bars */}
            <div className="absolute inset-0 flex gap-4">
              {data.map((d) => {
                const isHighlight = d.month === highlightMonth;
                const heightPercent = showSales ? (d.sales / roundedMax) * 100 : 0;
                return (
                  <div
                    key={d.month}
                    className="flex h-full w-10 shrink-0 flex-col items-center justify-end"
                  >
                    <div
                      title={formatLKR(d.sales)}
                      className={`w-full rounded-t transition-[height] ${
                        isHighlight ? "bg-active" : "bg-border"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* month labels */}
          <div className="mt-2 flex gap-4" style={{ width: chartWidth }}>
            {data.map((d) => (
              <span
                key={d.month}
                className={`w-10 shrink-0 text-center text-xs ${
                  d.month === highlightMonth ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
