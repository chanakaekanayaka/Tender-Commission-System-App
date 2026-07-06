export function formatLKR(value: number): string {
  return `Rs ${value.toLocaleString("en-US")}`;
}

// For table cells where the column header already conveys currency —
// no "Rs" prefix, but always 2 decimal places (e.g. "93,750.00").
export function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCompactLKR(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `Rs ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `Rs ${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return formatLKR(value);
}
