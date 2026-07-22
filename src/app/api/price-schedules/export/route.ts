import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import connectDB from "@/lib/db/connectDB";
import { PriceScheduleModel } from "@/lib/db/models/PriceSchedule.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError } from "@/lib/api/response";
import { formatLKR } from "@/lib/utils/currency";
import { toArrayBuffer } from "@/lib/utils/buffer";

const FORMATS = ["pdf", "csv", "excel"] as const;
type ExportFormat = (typeof FORMATS)[number];

interface ExportRow {
  procurementNo: string;
  entity: string;
  submittedDate: string;
  totalValue: number;
  status: string;
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function buildCSV(rows: ExportRow[]): string {
  const header = ["Procurement No", "Procuring Entity", "Submitted Date", "Total Value", "Status"];
  const lines = rows.map((r) =>
    [r.procurementNo, r.entity, r.submittedDate, String(r.totalValue), r.status].map(escapeCsvField).join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

async function buildExcel(rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Price Schedules");

  sheet.columns = [
    { header: "Procurement No", key: "procurementNo", width: 20 },
    { header: "Procuring Entity", key: "entity", width: 40 },
    { header: "Submitted Date", key: "submittedDate", width: 16 },
    { header: "Total Value", key: "totalValue", width: 16 },
    { header: "Status", key: "status", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function buildPDF(rows: ExportRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const columns = [
      { label: "Procurement No", x: 40, width: 105 },
      { label: "Procuring Entity", x: 150, width: 190 },
      { label: "Submitted Date", x: 345, width: 75 },
      { label: "Total Value", x: 425, width: 75 },
      { label: "Status", x: 505, width: 55 },
    ];

    doc.fontSize(16).font("Helvetica-Bold").text("Price Schedules History", 40, 40);

    let y = 75;
    doc.fontSize(9).font("Helvetica-Bold");
    columns.forEach((col) => doc.text(col.label, col.x, y, { width: col.width }));
    y += 16;
    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 8;

    doc.font("Helvetica");
    for (const row of rows) {
      const values = [row.procurementNo, row.entity, row.submittedDate, formatLKR(row.totalValue), row.status];
      columns.forEach((col, i) => doc.text(values[i], col.x, y, { width: col.width }));
      y += 18;
      if (y > 780) {
        doc.addPage();
        y = 40;
      }
    }

    doc.end();
  });
}

/** Generates a PDF/CSV/Excel export of the given Price Schedule rows. Takes explicit ids (rather
 *  than re-deriving the search filter server-side) so the export always matches exactly what the
 *  user has visible/filtered in the History table. */
export async function POST(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  let body: { format?: string; ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", 400);
  }

  const format = body.format as ExportFormat;
  if (!FORMATS.includes(format)) {
    return apiError("Invalid export format.", 400);
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return apiError("No rows to export.", 400);
  }

  await connectDB();
  // Staff can only ever export their own records (AI_INSTRUCTIONS.md §3) — same visibility rule
  // as GET /api/price-schedules.
  const filter =
    payload.role === "Admin"
      ? { _id: { $in: body.ids } }
      : { _id: { $in: body.ids }, createdBy: payload.userId };
  const records = await PriceScheduleModel.find(filter).sort({ createdAt: -1 });

  const rows: ExportRow[] = records.map((record) => ({
    procurementNo: record.procurementNo,
    entity: record.procuringEntity,
    submittedDate: record.closingDate.toISOString().slice(0, 10),
    totalValue: record.totalValue,
    status: record.status,
  }));

  if (format === "csv") {
    return new Response(buildCSV(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="price-schedules.csv"',
      },
    });
  }

  if (format === "excel") {
    const buffer = await buildExcel(rows);
    return new Response(toArrayBuffer(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="price-schedules.xlsx"',
      },
    });
  }

  const buffer = await buildPDF(rows);
  return new Response(toArrayBuffer(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="price-schedules.pdf"',
    },
  });
}
