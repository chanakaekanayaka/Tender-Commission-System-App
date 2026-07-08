"use client";

import { ExternalLink, FileText, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import type { ReceiptItem } from "@/shared/types/job-order.types";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.5;

interface ReceiptPreviewModalProps {
  receipt: ReceiptItem | null;
  onClose: () => void;
}

/** Real preview of the actual uploaded receipt (image/PDF), not the "unavailable" placeholder used elsewhere for mock document names — receipts genuinely hold a live `File` behind their object URL. */
export function ReceiptPreviewModal({ receipt, onClose }: ReceiptPreviewModalProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);

  // Reset zoom whenever a different receipt (or none) is shown — the
  // React-recommended way to adjust state in response to a prop change,
  // rather than a setState-in-effect that would cause an extra render.
  const [lastReceiptId, setLastReceiptId] = useState(receipt?.id);
  if (receipt?.id !== lastReceiptId) {
    setLastReceiptId(receipt?.id);
    setZoom(1);
  }

  const isImage = receipt?.fileType.startsWith("image/") ?? false;
  const isPdf = receipt?.fileType === "application/pdf";

  return (
    <Modal open={receipt !== null} onClose={onClose} title={receipt?.fileName ?? ""}>
      {receipt && isImage && (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
              disabled={zoom <= ZOOM_MIN}
              aria-label={t("jobOrderCreate.zoomOut")}
              className="rounded-none border border-border p-1.5 text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut className="h-4 w-4" aria-hidden />
            </button>
            <span className="min-w-[3rem] text-center text-xs text-muted">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
              disabled={zoom >= ZOOM_MAX}
              aria-label={t("jobOrderCreate.zoomIn")}
              className="rounded-none border border-border p-1.5 text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomIn className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto rounded-none border border-border bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: object URL, not an optimizable remote asset */}
            <img
              src={receipt.previewUrl}
              alt={receipt.fileName}
              style={{ transform: `scale(${zoom})` }}
              className="mx-auto origin-top transition-transform duration-200 ease-out"
            />
          </div>
        </div>
      )}

      {receipt && isPdf && (
        <iframe
          src={receipt.previewUrl}
          title={receipt.fileName}
          className="h-[70vh] w-full rounded-none border border-border"
        />
      )}

      {receipt && !isImage && !isPdf && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <FileText className="h-10 w-10 text-muted" aria-hidden />
          <p className="text-sm text-muted">{t("jobOrderCreate.noPreviewAvailable")}</p>
          <a
            href={receipt.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-none border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t("jobOrderCreate.openFile")}
          </a>
        </div>
      )}
    </Modal>
  );
}
