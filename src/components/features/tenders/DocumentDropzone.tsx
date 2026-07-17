"use client";

import { CheckCircle2, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { useTranslation } from "@/context/LanguageContext";
import type { PriceScheduleLineItem, PriceScheduleMetadata } from "@/shared/types/tender.types";

type Status = "idle" | "dragging" | "selected" | "extracting" | "done" | "error";

export interface ExtractResult {
  metadata: Partial<Omit<PriceScheduleMetadata, "uploadingDate">>;
  lineItems: PriceScheduleLineItem[];
  sourceDocument: { s3Key: string; fileName: string };
}

interface DocumentDropzoneProps {
  onExtracted: (result: ExtractResult) => void;
}

/** Owns the file + upload/extract call itself (unlike the old mock version, which only lifted the
 *  file *name* up) — keeps the two-step UX (pick file, confirm via "Parse") so a wrong file isn't
 *  sent to Textract by accident, while only the final parsed result is lifted to the parent. */
export function DocumentDropzone({ onExtracted }: DocumentDropzoneProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    setFile(selected);
    setErrorMessage(null);
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
    setErrorMessage(null);
  };

  const handleParse = async () => {
    if (!file) return;
    setStatus("extracting");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/price-schedules/extract", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to extract document.");
      }

      setStatus("done");
      onExtracted(result.data);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to extract document.");
    }
  };

  const canBrowse = status === "idle" || status === "dragging";
  const canParse = status === "selected" || status === "extracting" || status === "error";

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {t("dropzone.sourceDocument")}
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => canBrowse && inputRef.current?.click()}
        className={`flex min-h-56 flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed p-6 text-center transition-colors ${
          status === "dragging" ? "border-active bg-active/5" : "border-border"
        } ${canBrowse ? "cursor-pointer" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tiff"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {status === "extracting" ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">
              {t("dropzone.extracting", { fileName: file?.name ?? "" })}
            </p>
          </>
        ) : status === "done" ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-ink" aria-hidden />
            <p className="text-sm font-medium text-ink">{file?.name}</p>
            <p className="text-xs text-muted">{t("dropzone.extractedSuccessfully")}</p>
            <button type="button" onClick={handleReplace} className="text-xs text-muted underline hover:text-ink">
              {t("dropzone.replaceFile")}
            </button>
          </>
        ) : status === "selected" || status === "error" ? (
          <>
            {status === "error" ? (
              <XCircle className="h-6 w-6 text-ink" aria-hidden />
            ) : (
              <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
            )}
            <p className="text-sm font-medium text-ink">{file?.name}</p>
            {status === "error" && errorMessage && <p className="text-xs text-ink">{errorMessage}</p>}
            <button type="button" onClick={handleReplace} className="text-xs text-muted underline hover:text-ink">
              {t("dropzone.replaceFile")}
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">{t("dropzone.dropHere")}</p>
            <p className="text-xs text-muted">
              {t("dropzone.fileTypesHint")}{" "}
              <span className="underline">{t("dropzone.browseFiles")}</span>
            </p>
          </>
        )}
      </div>

      {canParse && (
        <button
          type="button"
          onClick={handleParse}
          disabled={status === "extracting"}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink hover:bg-active/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "extracting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("dropzone.parsing")}
            </>
          ) : (
            t("dropzone.parse")
          )}
        </button>
      )}
    </div>
  );
}
