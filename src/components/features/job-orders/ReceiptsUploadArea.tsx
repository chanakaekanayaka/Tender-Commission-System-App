"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

interface ReceiptsUploadAreaProps {
  onFilesAdded: (files: File[]) => void;
}

/** Multi-file accumulate-as-you-go dropzone — unlike `DocumentDropzone`, there's no single terminal "done" state since receipts keep piling up in the list below. */
export function ReceiptsUploadArea({ onFilesAdded }: ReceiptsUploadAreaProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const valid = files.filter((file) => ALLOWED_TYPES.includes(file.type));

    if (valid.length < files.length) {
      setToast({ message: t("jobOrderCreate.receiptInvalidType"), variant: "error" });
    }
    if (valid.length > 0) onFilesAdded(valid);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {t("jobOrderCreate.receiptsUploadHeading")}
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-active bg-active/5" : "border-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
        <p className="text-sm font-medium text-ink">{t("jobOrderCreate.receiptsDropHere")}</p>
        <p className="text-xs text-muted">
          {t("jobOrderCreate.receiptFileTypesHint")} <span className="underline">{t("dropzone.browseFiles")}</span>
        </p>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
