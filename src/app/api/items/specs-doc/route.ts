import type { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import connectDB from "@/lib/db/connectDB";
import { getObjectBuffer } from "@/lib/aws/s3";
import { ItemModel } from "@/lib/db/models/Item.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError } from "@/lib/api/response";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";
import { toArrayBuffer } from "@/lib/utils/buffer";

interface SpecsDocItem {
  code: string;
  name: string;
  imageKey?: string;
  specs: { label: string; value: string }[];
}

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 495; // A4 (595.28pt) minus left/right margins
const IMAGE_BOX_HEIGHT = 240;
// pdfkit only embeds these two formats — anything else (e.g. an older WebP upload) falls back
// to a placeholder rather than throwing and failing the whole document.
const EMBEDDABLE_IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);

async function buildSpecsPDF(items: SpecsDocItem[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) doc.addPage();

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text(defaultSystemConfig.companyName.toUpperCase());
    doc
      .moveTo(PAGE_MARGIN, doc.y + 6)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y + 6)
      .strokeColor("#e5e7eb")
      .stroke();
    doc.moveDown(2);

    const imageBoxTop = doc.y;
    doc.rect(PAGE_MARGIN, imageBoxTop, CONTENT_WIDTH, IMAGE_BOX_HEIGHT).strokeColor("#e5e7eb").stroke();

    let imageDrawn = false;
    if (item.imageKey) {
      try {
        const { buffer, contentType } = await getObjectBuffer(item.imageKey);
        if (contentType && EMBEDDABLE_IMAGE_TYPES.has(contentType)) {
          doc.image(buffer, PAGE_MARGIN + 10, imageBoxTop + 10, {
            fit: [CONTENT_WIDTH - 20, IMAGE_BOX_HEIGHT - 20],
            align: "center",
            valign: "center",
          });
          imageDrawn = true;
        }
      } catch (err) {
        console.error(`Failed to load image for item ${item.code}:`, err);
      }
    }
    if (!imageDrawn) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#9ca3af")
        .text("No image available", PAGE_MARGIN, imageBoxTop + IMAGE_BOX_HEIGHT / 2 - 5, {
          width: CONTENT_WIDTH,
          align: "center",
        });
    }

    doc.y = imageBoxTop + IMAGE_BOX_HEIGHT + 20;

    doc.fontSize(18).font("Helvetica-Bold").fillColor("#111827").text(item.name);
    doc.fontSize(11).font("Helvetica").fillColor("#6b7280").text(item.code);
    doc.moveDown(1.2);

    if (item.specs.length === 0) {
      doc.fontSize(11).font("Helvetica").fillColor("#9ca3af").text("No specifications added yet.");
      continue;
    }

    const labelWidth = 180;
    const valueWidth = CONTENT_WIDTH - labelWidth;
    for (const spec of item.specs) {
      const rowTop = doc.y;
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#4b5563").text(spec.label, PAGE_MARGIN, rowTop, {
        width: labelWidth,
      });
      doc.fontSize(11).font("Helvetica").fillColor("#111827").text(spec.value, PAGE_MARGIN + labelWidth, rowTop, {
        width: valueWidth,
      });
      const rowBottom = Math.max(doc.y, rowTop + 18) + 6;
      doc
        .moveTo(PAGE_MARGIN, rowBottom - 6)
        .lineTo(PAGE_MARGIN + CONTENT_WIDTH, rowBottom - 6)
        .strokeColor("#f3f4f6")
        .stroke();
      doc.y = rowBottom;
    }
  }

  doc.end();
  return finished;
}

/** Generates a real, downloadable PDF specs document (image + specs table per item) — replaces
 *  the old browser print-dialog stand-in (src/lib/utils/openItemSpecsDocument.ts, now unused). */
export async function POST(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return apiError("No items selected.", 400);
  }

  await connectDB();
  const items = await ItemModel.find({ _id: { $in: ids } }).sort({ code: 1 });
  if (items.length === 0) {
    return apiError("No matching items found.", 404);
  }

  const buffer = await buildSpecsPDF(
    items.map((item) => ({ code: item.code, name: item.name, imageKey: item.imageKey, specs: item.specs })),
  );

  return new Response(toArrayBuffer(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="item-specs.pdf"',
    },
  });
}
