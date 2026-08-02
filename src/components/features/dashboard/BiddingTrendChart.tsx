"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "@/context/LanguageContext";
import type { PriceScheduleTrendPoint } from "@/types/dashboard";

interface BiddingTrendChartProps {
  data: PriceScheduleTrendPoint[];
}

/** Single-series magnitude-by-month bar chart — same mark spec (sharp `radius={0}` bars, recessive
 *  grid, brand `--color-active` fill) as StaffPerformanceChart, so it reads as the same chart
 *  family rather than a one-off. The current month is the last bar; it gets a direct "This month"
 *  label instead of a second color, so identity never depends on hue alone. */
export function BiddingTrendChart({ data }: BiddingTrendChartProps) {
  const { t } = useTranslation();
  const currentMonth = data.at(-1)?.month;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
            formatter={(value) => [String(value), t("dashboard.thisMonthBidding")]}
            contentStyle={{ borderRadius: 0, border: "1px solid var(--color-border)", background: "var(--color-card)" }}
          />
          <Bar dataKey="count" fill="var(--color-active)" radius={0}>
            <LabelList
              dataKey="month"
              position="top"
              content={(props) => {
                const { x, y, width, value } = props;
                if (value !== currentMonth || typeof x !== "number" || typeof width !== "number") return null;
                return (
                  <text
                    x={x + width / 2}
                    y={Number(y) - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--color-active)"
                  >
                    {t("dashboard.thisMonthLabel")}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
