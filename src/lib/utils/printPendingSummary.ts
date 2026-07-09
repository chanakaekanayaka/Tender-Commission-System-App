import { escapeHtml } from "@/lib/utils/escapeHtml";

interface PendingPaymentSummaryParams {
  companyName: string;
  title: string;
  printedAtLabel: string;
  rows: Array<{ label: string; value: string }>;
}

// TODO: replace with a real PDF export once a /api/job-orders/{id}/pending-summary.pdf-style
// route exists — UI-only mock phase (AGENTS.md). The browser print dialog's "Save as PDF"
// destination stands in for a real one-click download in the meantime.
export function openPendingPaymentSummary(params: PendingPaymentSummaryParams): void {
  const printWindow = window.open("", "_blank", "width=700,height=900");
  if (!printWindow) return;

  const rowsHtml = params.rows
    .map(
      (row) =>
        `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`,
    )
    .join("");

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(params.title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; padding: 40px; }
      .company-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
      h1 { font-size: 20px; margin: 0 0 24px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      th { width: 40%; font-weight: 600; color: #4b5563; }
      .printed-at { margin-top: 24px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="company-name">${escapeHtml(params.companyName)}</div>
    <h1>${escapeHtml(params.title)}</h1>
    <table>${rowsHtml}</table>
    <p class="printed-at">${escapeHtml(params.printedAtLabel)}</p>
  </body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
