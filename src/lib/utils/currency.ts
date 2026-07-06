export function formatLKR(value: number): string {
  return `Rs ${value.toLocaleString("en-US")}`;
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
