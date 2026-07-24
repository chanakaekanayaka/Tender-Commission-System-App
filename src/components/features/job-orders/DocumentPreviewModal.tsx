"use client";

import { Download, ExternalLink, FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileName?: string;
  fileType?: string;
  url?: string;
}

/** Generic image/PDF/other preview for an already-uploaded document, given a signed S3 URL —
 *  shared by any Job Order document that (unlike the wizard's own receipts) can genuinely be
 *  either an image or a PDF, e.g. Pending's payment proof. */
export function DocumentPreviewModal({ open, onClose, fileName, fileType, url }: DocumentPreviewModalProps) {
  const { t } = useTranslation();
  const isImage = fileType?.startsWith("image/") ?? false;
  const isPdf = fileType === "application/pdf";

  return (
    <Modal open={open} onClose={onClose} title={fileName ?? ""}>
      {url && (
        <div className="space-y-3">
          {isImage && (
            <div className="max-h-[70vh] overflow-auto rounded-none border border-border bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, not an optimizable remote asset */}
              <img src={url} alt={fileName ?? ""} className="mx-auto" />
            </div>
          )}

          {isPdf && (
            <iframe src={url} title={fileName ?? ""} className="h-[70vh] w-full rounded-none border border-border" />
          )}

          {!isImage && !isPdf && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <FileText className="h-10 w-10 text-muted" aria-hidden />
              <p className="text-sm text-muted">{t("jobOrderCreate.noPreviewAvailable")}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-none border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                {t("jobOrderCreate.openFile")}
              </a>
            </div>
          )}

          <div className="flex justify-end">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-none border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {t("activeJobOrders.download")}
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}
