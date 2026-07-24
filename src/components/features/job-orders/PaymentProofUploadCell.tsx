"use client";

import { Eye, FileText, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

interface PaymentProofUploadCellProps {
  jobOrderId: string;
  fileName?: string;
  onUploaded: (data: { fileName: string; fileType: string; previewUrl: string }) => void;
  onError: (message: string) => void;
  onPreview: () => void;
}

/** Staff's one action on a Pending row — upload evidence the entity actually paid (bank slip,
 *  cheque copy, etc.), same S3-upload pattern as the wizard's receipt upload. Uploading again
 *  replaces whatever was there before, so this doubles as the "Replace" control. */
export function PaymentProofUploadCell({
  jobOrderId,
  fileName,
  onUploaded,
  onError,
  onPreview,
}: PaymentProofUploadCellProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError(t("staffPendingJobOrders.proofInvalidType"));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/job-orders/${jobOrderId}/payment-proof`, { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to upload payment proof.");
      }
      onUploaded({ fileName: result.data.fileName, fileType: result.data.fileType, previewUrl: result.data.previewUrl });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to upload payment proof.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {fileName ? (
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-1.5 text-sm text-ink underline decoration-border underline-offset-2 hover:text-active"
        >
          <FileText className="h-4 w-4 text-muted" aria-hidden />
          <span className="max-w-[8rem] truncate">{fileName}</span>
          <Eye className="h-3.5 w-3.5 text-muted" aria-hidden />
        </button>
      ) : (
        <span className="text-sm text-muted">{t("staffPendingJobOrders.proofNotUploaded")}</span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-1.5 rounded-none border border-border bg-card px-2 py-1 text-xs font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-3.5 w-3.5" aria-hidden />
        )}
        {isUploading
          ? t("staffPendingJobOrders.uploadingProof")
          : fileName
            ? t("staffPendingJobOrders.replaceProof")
            : t("staffPendingJobOrders.uploadProof")}
      </button>
    </div>
  );
}
