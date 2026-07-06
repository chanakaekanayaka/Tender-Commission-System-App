"use client";

import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

type Status = "idle" | "dragging" | "extracting" | "done";

export function DocumentDropzone() {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Placeholder for the real Gemini OCR extraction (AI_INSTRUCTIONS.md Workflow A).
  // No backend call exists yet — this just simulates the progress bar so the
  // "AI Extracting..." state has something to show in this UI-only pass.
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
        Source Document
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
              AI extracting data from {fileName}…
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
            <p className="text-xs text-muted">Extracted successfully</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStatus("idle");
                setFileName(null);
              }}
              className="text-xs text-muted underline hover:text-ink"
            >
              Replace file
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">Drop tender document here</p>
            <p className="text-xs text-muted">
              PDF / DOCX / image · or{" "}
              <span className="underline">browse files</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
