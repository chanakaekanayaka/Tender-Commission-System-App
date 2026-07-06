export interface KpiCardLink {
  label: string;
  href: string;
}

export interface KpiCardData {
  id: string;
  label: string;
  value: string;
  helperText: string;
  helperLink?: KpiCardLink;
  showWarningIcon?: boolean;
  progressPercent?: number;
}

export interface MonthlyPerformance {
  month: string;
  sales: number;
  target: number;
}
