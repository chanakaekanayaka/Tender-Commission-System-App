import { escapeHtml } from "@/lib/utils/escapeHtml";

interface PaymentReminderLetterParams {
  companyName: string;
  accentColor: string;
  jobOrderNo: string;
  todayLabel: string;
  dateFieldLabel: string;
  toFieldLabel: string;
  subjectLabel: string;
  entityName: string;
  entityAddress: string;
  bodyText: string;
}

// TODO: replace with a real PDF export (e.g. a server-rendered
// /api/job-orders/{id}/reminder-letter.pdf route) once that exists — UI-only mock phase
// (AGENTS.md). The browser print dialog's "Save as PDF" destination stands in for a real
// one-click download in the meantime.
export function openPaymentReminderLetter(params: PaymentReminderLetterParams): void {
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) return;

  const bodyHtml = escapeHtml(params.bodyText).replaceAll("\n", "<br />");

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(params.jobOrderNo)} — Payment Reminder</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; padding: 48px; }
      .letterhead { border-bottom: 4px solid ${escapeHtml(params.accentColor)}; padding-bottom: 16px; margin-bottom: 32px; }
      .company-name { font-size: 22px; font-weight: 700; letter-spacing: 0.02em; }
      .meta { margin-bottom: 24px; font-size: 14px; }
      .meta p { margin: 2px 0; }
      .subject { font-weight: 700; margin-bottom: 24px; }
      .body-text { font-size: 14px; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="letterhead">
      <div class="company-name">${escapeHtml(params.companyName)}</div>
    </div>

    <div class="meta">
      <p>${escapeHtml(params.dateFieldLabel)}: ${escapeHtml(params.todayLabel)}</p>
      <p>${escapeHtml(params.toFieldLabel)}: ${escapeHtml(params.entityName)}</p>
      <p>${escapeHtml(params.entityAddress)}</p>
    </div>

    <div class="subject">${escapeHtml(params.subjectLabel)}</div>

    <div class="body-text">${bodyHtml}</div>
  </body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
