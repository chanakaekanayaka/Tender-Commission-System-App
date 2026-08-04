"use client";

import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

interface JobOrderDocumentDropzoneProps {
  fileName?: string;
  isUploading?: boolean;
  uploadError?: string;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  onParse?: () => void;
  isParsing?: boolean;
}

/** Real S3 upload for the Job Order's own Source Document (PDF or image) — no OCR/parsing wired up
 *  yet, so "Scan" (if provided) stays a separate, still-mock action layered on top of a genuinely
 *  uploaded file. */
export function JobOrderDocumentDropzone({
  fileName,
  isUploading = false,
  uploadError,
  onFileSelected,
  onRemove,
  onParse,
  isParsing = false,
}: JobOrderDocumentDropzoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFile = Boolean(fileName);
  const canBrowse = !hasFile && !isUploading;
  // Scan just looks up canned mock metadata by procurement no for now (no real Textract wired up
  // yet — see JobOrderWizardContext's handleParse) but it should still only ever run against a
  // document that's actually finished uploading, not be usable for the "type everything by hand,
  // never pick a file" path.
  const canParse = hasFile && !isUploading && !uploadError;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setToast({ message: t("jobOrderCreate.sourceDocumentInvalidType"), variant: "error" });
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (canBrowse) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {t("dropzone.sourceDocument")}
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (canBrowse) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => canBrowse && inputRef.current?.click()}
        className={`flex min-h-56 flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-active bg-active/5" : "border-border"
        } ${canBrowse ? "cursor-pointer" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">
              {t("jobOrderCreate.sourceDocumentUploading", { fileName: fileName ?? "" })}
            </p>
          </>
        ) : hasFile && !uploadError ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-ink" aria-hidden />
            <p className="text-sm font-medium text-ink">{fileName}</p>
            <p className="text-xs text-muted">{t("jobOrderCreate.sourceDocumentUploaded")}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-xs text-muted underline hover:text-ink"
            >
              {t("dropzone.replaceFile")}
            </button>
          </>
        ) : uploadError ? (
          <>
            <p className="text-sm font-medium text-ink">{fileName}</p>
            <p className="text-xs text-red-600">{uploadError}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-xs text-muted underline hover:text-ink"
            >
              {t("dropzone.replaceFile")}
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">{t("dropzone.dropHere")}</p>
            <p className="text-xs text-muted">
              {t("jobOrderCreate.sourceDocumentFileTypesHint")}{" "}
              <span className="underline">{t("dropzone.browseFiles")}</span>
            </p>
          </>
        )}
      </div>

      {onParse && (
        <button
          type="button"
          onClick={onParse}
          disabled={isParsing || !canParse}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink hover:bg-active/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isParsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("dropzone.parsing")}
            </>
          ) : (
            t("dropzone.parse")
          )}
        </button>
      )}

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
