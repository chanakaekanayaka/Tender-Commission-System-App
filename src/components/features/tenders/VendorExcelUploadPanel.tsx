"use client";

import { CheckCircle2, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";

type Status = "idle" | "dragging" | "selected" | "uploading" | "error" | "invalidType";

const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

/**
 * Uploads the vendor comparison Excel for a tender — a real spreadsheet, not a scan, so it's read
 * directly with exceljs (no OCR/Textract, unlike DocumentDropzone which this otherwise mirrors:
 * same two-step select→confirm flow so a wrong file isn't sent by accident).
 */
export function VendorExcelUploadPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFile(selected);
      setToast({ message: t("vendorExcelUploads.invalidType"), variant: "error" });
      setStatus("invalidType");
      return;
    }
    setFile(selected);
    setToast(null);
    setStatus("selected");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus((s) => (s === "dragging" ? "idle" : s));
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (status === "idle") setStatus("dragging");
  };

  const handleDragLeave = () => {
    if (status === "dragging") setStatus("idle");
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus("idle");
    setFile(null);
    setToast(null);
  };

  const resetAfterSuccess = () => {
    setStatus("idle");
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/vendor-excel-uploads", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to upload file.");
      }

      setToast({ message: t("vendorExcelUploads.uploadSuccess"), variant: "success" });
      resetAfterSuccess();
      router.refresh();
    } catch (err) {
      setStatus("error");
      setToast({ message: err instanceof Error ? err.message : "Failed to upload file.", variant: "error" });
    }
  };

  const canBrowse = status === "idle" || status === "dragging";
  const canUpload = status === "selected" || status === "uploading" || status === "error";

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {t("vendorExcelUploads.uploadHeading")}
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => canBrowse && inputRef.current?.click()}
        className={`flex min-h-40 flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed p-6 text-center transition-colors ${
          status === "dragging" ? "border-active bg-active/5" : "border-border"
        } ${canBrowse ? "cursor-pointer" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {status === "uploading" ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">{t("vendorExcelUploads.uploading")}</p>
          </>
        ) : status === "selected" || status === "error" || status === "invalidType" ? (
          <>
            {status === "error" || status === "invalidType" ? (
              <XCircle className="h-6 w-6 text-ink" aria-hidden />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-ink" aria-hidden />
            )}
            <p className="text-sm font-medium text-ink">{file?.name}</p>
            <button type="button" onClick={handleReplace} className="text-xs text-muted underline hover:text-ink">
              {t("vendorExcelUploads.replaceFile")}
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">{t("vendorExcelUploads.dropHere")}</p>
            <p className="text-xs text-muted">
              {t("vendorExcelUploads.fileTypesHint")}{" "}
              <span className="underline">{t("vendorExcelUploads.browseFiles")}</span>
            </p>
          </>
        )}
      </div>

      {canUpload && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={status === "uploading"}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink hover:bg-active/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("vendorExcelUploads.uploading")}
            </>
          ) : (
            t("vendorExcelUploads.upload")
          )}
        </button>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
