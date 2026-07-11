import { escapeHtml } from "@/lib/utils/escapeHtml";

interface ItemSpecsDocumentItem {
  code: string;
  name: string;
  imageUrl?: string;
  specs: Array<{ label: string; value: string }>;
}

interface ItemSpecsDocumentParams {
  companyName: string;
  title: string;
  items: ItemSpecsDocumentItem[];
}

// TODO: replace with a real PDF export (e.g. a server-rendered /api/items/specs-doc.pdf
// route) once that exists — UI-only mock phase (AGENTS.md). The browser print dialog's
// "Save as PDF" destination stands in for a real one-click download in the meantime.
export function openItemSpecsDocument(params: ItemSpecsDocumentParams): void {
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) return;

  const pagesHtml = params.items
    .map((item) => {
      const imageHtml = item.imageUrl
        ? `<img class="item-image" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" />`
        : `<div class="item-image item-image-placeholder">No image</div>`;

      const specsHtml = item.specs
        .map(
          (spec) =>
            `<tr><th>${escapeHtml(spec.label)}</th><td>${escapeHtml(spec.value)}</td></tr>`,
        )
        .join("");

      return `<section class="item-page">
    ${imageHtml}
    <h2>${escapeHtml(item.name)}</h2>
    <p class="item-code">${escapeHtml(item.code)}</p>
    <table>${specsHtml}</table>
  </section>`;
    })
    .join("");

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(params.title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; padding: 0; }
      .company-name { font-size: 14px; font-weight: 700; padding: 24px 40px 0; }
      .item-page { padding: 24px 40px 40px; }
      .item-page:not(:last-child) { page-break-after: always; }
      .item-image { display: block; width: 100%; max-height: 320px; object-fit: contain; border: 1px solid #e5e7eb; margin-bottom: 16px; }
      .item-image-placeholder { height: 200px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 13px; background: #f9fafb; }
      h2 { font-size: 20px; margin: 0 0 4px; }
      .item-code { font-size: 13px; color: #6b7280; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      th { width: 40%; font-weight: 600; color: #4b5563; }
    </style>
  </head>
  <body>
    <div class="company-name">${escapeHtml(params.companyName)}</div>
    ${pagesHtml}
  </body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
