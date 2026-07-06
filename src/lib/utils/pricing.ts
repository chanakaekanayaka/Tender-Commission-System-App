// VAT rate is Admin-configurable ("System Config" per AI_INSTRUCTIONS.md §3).
// Hardcoded until that config API/context exists — every call site below
// should switch to the real value from there once it's built.
export const DEFAULT_VAT_RATE = 0.15;

export interface LineItemTotals {
  base: number;
  vat: number;
  subTotal: number;
}

// Math Logic (AI_INSTRUCTIONS.md §4, Workflow A):
// Sub Total = Qty * Unit Price, then VAT is applied on top when enabled.
export function calculateLineItemTotals(
  qty: number,
  unitPrice: number,
  vatRate: number = DEFAULT_VAT_RATE,
): LineItemTotals {
  const base = qty * unitPrice;
  const vat = base * vatRate;
  const subTotal = base + vat;
  return { base, vat, subTotal };
}
