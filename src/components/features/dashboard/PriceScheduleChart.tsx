"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/context/LanguageContext";
import type { PriceScheduleTrendPoint } from "@/types/dashboard";

interface PriceScheduleChartProps {
  data: PriceScheduleTrendPoint[];
}

const LINE_COLOR = "#4f46e5"; // indigo-600 — scoped to this chart, the rest of the UI stays neutral

/** Client Component — recharts needs the DOM to measure/render, so this is the sole client boundary in "Price Schedule Trends". */
export function PriceScheduleChart({ data }: PriceScheduleChartProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-indigo-600" aria-hidden />
        <h2 className="font-semibold text-ink">{t("dashboard.priceScheduleTrends")}</h2>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              formatter={(value) => [String(value), t("sidebar.priceSchedules")]}
              labelStyle={{ color: "var(--color-ink)", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "var(--color-ink)" }}
              contentStyle={{
                borderRadius: 0,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={LINE_COLOR}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)", fill: LINE_COLOR }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--color-card)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
