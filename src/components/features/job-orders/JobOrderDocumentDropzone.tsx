"use client";

import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { useTranslation } from "@/context/LanguageContext";

type Status = "idle" | "dragging" | "extracting" | "done";

interface JobOrderDocumentDropzoneProps {
  onParse?: () => void;
  isParsing?: boolean;
}

/** Split out from tenders/DocumentDropzone.tsx when that component switched to a real Textract
 *  upload flow — Job Orders' own creation wizard is still a separate, UI-only mock pass (no
 *  backend for this feature yet), so it keeps the old simulated-progress behavior unchanged. */
export function JobOrderDocumentDropzone({ onParse, isParsing = false }: JobOrderDocumentDropzoneProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateExtraction = (name: string) => {
    setFileName(name);
    setStatus("extracting");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 20;
        if (next >= 100) {
          clearInterval(interval);
          setStatus("done");
          return 100;
        }
        return next;
      });
    }, 300);
  };

  const handleFile = (file: File | undefined) => {
    if (file) simulateExtraction(file.name);
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

  const canBrowse = status === "idle" || status === "dragging";

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
          accept=".pdf,.docx,image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {status === "extracting" ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">
              {t("dropzone.extracting", { fileName: fileName ?? "" })}
            </p>
            <div className="h-2 w-40 overflow-hidden rounded-none bg-border">
              <div
                className="h-full rounded-none bg-active transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted">{progress}%</p>
          </>
        ) : status === "done" ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-ink" aria-hidden />
            <p className="text-sm font-medium text-ink">{fileName}</p>
            <p className="text-xs text-muted">{t("dropzone.extractedSuccessfully")}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStatus("idle");
                setFileName(null);
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
              {t("dropzone.fileTypesHint")}{" "}
              <span className="underline">{t("dropzone.browseFiles")}</span>
            </p>
          </>
        )}
      </div>

      {onParse && (
        <button
          type="button"
          onClick={onParse}
          disabled={isParsing}
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
    </div>
  );
}
