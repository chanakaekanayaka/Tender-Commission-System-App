"use client";

import { Check, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";

interface UploadButtonProps {
  jobNumber: string;
}

/** Client Component — the only interactive piece of a pending-order row (file picker + local "uploaded" state). */
export function UploadButton({ jobNumber }: UploadButtonProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        aria-label={`Upload bill copy for ${jobNumber}`}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={fileName ?? undefined}
        className={`inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-medium transition-colors ${
          fileName
            ? "border-border bg-card text-muted"
            : "border-transparent bg-active text-active-ink hover:opacity-90"
        }`}
      >
        {fileName ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Upload className="h-3.5 w-3.5" aria-hidden />}
        {fileName ? t("dashboard.uploaded") : t("dashboard.upload")}
      </button>
    </>
  );
}
