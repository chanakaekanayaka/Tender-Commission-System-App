interface StatCardProps {
  label: string;
  value: string;
  helperText?: string;
}

/** Server Component — same card shell/typography as DashboardKpiCard, without the progress bar / warning-link extras admin KPIs need. */
export function StatCard({ label, value, helperText }: StatCardProps) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {helperText && <p className="mt-2 text-sm text-muted">{helperText}</p>}
    </div>
  );
}
