"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactLKR, formatLKR } from "@/lib/utils/currency";
import type { StaffMonthlyPerformance } from "@/types/dashboard";

interface StaffPerformanceChartProps {
  data: StaffMonthlyPerformance[];
}

/** Client Component — recharts needs the DOM to measure/render, so this is the sole client boundary in "My Performance". */
export function StaffPerformanceChart({ data }: StaffPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value: number) => formatCompactLKR(value).replace("Rs ", "")}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
          formatter={(value) => [formatLKR(Number(value)), "Commission"]}
          contentStyle={{ borderRadius: 0, border: "1px solid var(--color-border)", background: "var(--color-card)" }}
        />
        <Bar dataKey="amount" fill="var(--color-active)" radius={0} />
      </BarChart>
    </ResponsiveContainer>
  );
}
