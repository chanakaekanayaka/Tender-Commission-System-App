import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import PDFDocument from "pdfkit";
import connectDB from "@/lib/db/connectDB";
import {
  JobOrderModel,
  type JobOrderExpenseSubdoc,
  type JobOrderLineItemSubdoc,
  type JobOrderReceiptSubdoc,
} from "@/lib/db/models/JobOrder.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getSignedImageUrl, uploadDocumentToS3 } from "@/lib/aws/s3";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { formatLKR } from "@/lib/utils/currency";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 495; // A4 (595.28pt) minus left/right margins

interface BillData {
  jobOrderNo: string;
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
  lineItems: JobOrderLineItemSubdoc[];
  originalTotal: number;
  newTotal: number;
  markupValue: number;
  commissionValue: number;
  otherExpensesTotal: number;
  profit: number;
}

async function buildJobOrderBillPDF(data: BillData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827").text(defaultSystemConfig.companyName.toUpperCase());
  doc
    .moveTo(PAGE_MARGIN, doc.y + 6)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y + 6)
    .strokeColor("#e5e7eb")
    .stroke();
  doc.moveDown(1.5);

  doc.fontSize(18).font("Helvetica-Bold").fillColor("#111827").text("Job Order Bill");
  doc.fontSize(11).font("Helvetica").fillColor("#6b7280").text(data.jobOrderNo);
  doc.moveDown(1);

  const detailLabelWidth = 140;
  const detailValueWidth = CONTENT_WIDTH - detailLabelWidth;
  const detailRow = (label: string, value: string) => {
    const rowTop = doc.y;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#4b5563")
      .text(label, PAGE_MARGIN, rowTop, { width: detailLabelWidth });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#111827")
      .text(value, PAGE_MARGIN + detailLabelWidth, rowTop, { width: detailValueWidth });
    doc.y = Math.max(doc.y, rowTop + 16);
  };
  detailRow("Procurement No", data.procurementNo);
  detailRow("Procurement Title", data.procurementTitle);
  detailRow("Procuring Entity", data.procuringEntity);
  doc.moveDown(1.5);

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text("Line Items");
  doc.moveDown(0.5);

  const columns = [
    { label: "Item", x: PAGE_MARGIN, width: 225 },
    { label: "Qty", x: PAGE_MARGIN + 225, width: 60 },
    { label: "Unit Price", x: PAGE_MARGIN + 285, width: 100 },
    { label: "Sub Total", x: PAGE_MARGIN + 385, width: 110 },
  ];
  let y = doc.y;
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#4b5563");
  columns.forEach((col) => doc.text(col.label, col.x, y, { width: col.width }));
  y += 16;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y).strokeColor("#e5e7eb").stroke();
  y += 6;

  doc.font("Helvetica").fillColor("#111827");
  for (const row of data.lineItems) {
    const { subTotal } = calculateLineItemTotals(row.qty, row.unitPrice);
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(9).text(row.item, columns[0].x, y, { width: columns[0].width });
    doc.text(String(row.qty), columns[1].x, y, { width: columns[1].width });
    doc.text(formatLKR(row.unitPrice), columns[2].x, y, { width: columns[2].width });
    doc.text(formatLKR(Math.round(subTotal)), columns[3].x, y, { width: columns[3].width });
    y += 18;
  }
  doc.y = y + 10;

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text("Financial Summary");
  doc.moveDown(0.5);

  const summaryRow = (label: string, value: number, bold = false) => {
    const rowTop = doc.y;
    const font = bold ? "Helvetica-Bold" : "Helvetica";
    doc.fontSize(10).font(font).fillColor("#111827").text(label, PAGE_MARGIN, rowTop, { width: 300 });
    doc
      .fontSize(10)
      .font(font)
      .fillColor("#111827")
      .text(formatLKR(Math.round(value)), PAGE_MARGIN + 300, rowTop, { width: CONTENT_WIDTH - 300, align: "right" });
    doc.y = rowTop + 16;
  };

  summaryRow("Original Total", data.originalTotal);
  summaryRow("New Total", data.newTotal);
  summaryRow("Markup", data.markupValue);
  summaryRow("Sales Commission", -data.commissionValue);
  summaryRow("Other Expenses", -data.otherExpensesTotal);
  doc
    .moveTo(PAGE_MARGIN, doc.y + 4)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y + 4)
    .strokeColor("#e5e7eb")
    .stroke();
  doc.moveDown(1);
  summaryRow("Profit", data.profit, true);

  doc.end();
  return finished;
}

/** Generates the Job Order's bill as a real PDF, uploads it to S3, and records the document on
 *  the Job Order itself — only reachable once Step 3 (Markup & Summary) is done, mirroring the
 *  Active table's own completedStep === 3 gate on this action. Every figure here is recomputed
 *  from the stored record, never trusted from the request body, since this is a financial document. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();
    const filter = payload.role === "Admin" ? { _id: id } : { _id: id, createdBy: payload.userId };

    const jobOrder = await JobOrderModel.findOne(filter);
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }
    if (jobOrder.completedStep !== 3) {
      return apiError("Complete Step 3 (Markup & Summary) before generating a bill.", 400);
    }

    const sumSubTotals = (rows: JobOrderLineItemSubdoc[]) =>
      rows.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice).subTotal, 0);

    const originalTotal = sumSubTotals(jobOrder.originalLineItems);
    const newTotal = sumSubTotals(jobOrder.lineItems);
    const receiptsTotal = jobOrder.receipts.reduce(
      (sum: number, receipt: JobOrderReceiptSubdoc) => sum + receipt.amount,
      0,
    );
    const manualExpensesTotal = jobOrder.expensesZeroed
      ? 0
      : jobOrder.otherExpenses.reduce((sum: number, expense: JobOrderExpenseSubdoc) => sum + expense.amount, 0);
    const otherExpensesTotal = receiptsTotal + manualExpensesTotal;
    const profit = jobOrder.markupValue - (jobOrder.commissionValue + otherExpensesTotal);

    const buffer = await buildJobOrderBillPDF({
      jobOrderNo: jobOrder.jobOrderNo,
      procurementNo: jobOrder.procurementNo,
      procurementTitle: jobOrder.procurementTitle,
      procuringEntity: jobOrder.procuringEntity,
      lineItems: jobOrder.lineItems,
      originalTotal,
      newTotal,
      markupValue: jobOrder.markupValue,
      commissionValue: jobOrder.commissionValue,
      otherExpensesTotal,
      profit,
    });

    const fileName = `${jobOrder.jobOrderNo}-bill.pdf`;
    const s3Key = `job-orders/bills/${randomUUID()}/${fileName}`;
    await uploadDocumentToS3(buffer, s3Key, "application/pdf");

    jobOrder.billDocument = { fileName, s3Key, generatedAt: new Date() };
    // What the procuring entity actually owes — line items (already VAT-inclusive) plus markup.
    // Commission/other expenses are the company's own internal cost allocation, not billed onward.
    jobOrder.billAmount = newTotal + jobOrder.markupValue;
    jobOrder.profit = profit;
    // Regenerating a bill (e.g. after fixing a mistake) resets payment verification — the old PDF
    // this was verified against no longer exists, so re-verifying against the new one is required.
    jobOrder.paymentVerifiedAt = null;
    await jobOrder.save();

    const previewUrl = await getSignedImageUrl(s3Key);
    return apiSuccess({ fileName, previewUrl }, "Bill generated successfully.");
  } catch (err) {
    console.error("POST /api/job-orders/[id]/generate-bill failed:", err);
    return apiError("Something went wrong while generating the bill.", 500);
  }
}
