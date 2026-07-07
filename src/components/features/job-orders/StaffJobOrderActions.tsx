import { Check, Upload } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "@/context/LanguageContext";
import type { JobOrderStatus } from "@/shared/types/job-order.types";

interface StaffJobOrderActionsProps {
  jobOrderNo: string;
  status: JobOrderStatus;
  onUpload: (fileName: string) => void;
}

/** Staff-only row action — attaches the Job Order (bill) document; once uploaded, Admin picks it up from here. */
export function StaffJobOrderActions({ jobOrderNo, status, onUpload }: StaffJobOrderActionsProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasDocument = status !== "Pending";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file.name);
        }}
        aria-label={`Upload job order document for ${jobOrderNo}`}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={hasDocument}
        className={`inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-medium transition-colors ${
          hasDocument
            ? "cursor-not-allowed border-border bg-card text-muted"
            : "border-transparent bg-active text-active-ink hover:opacity-90"
        }`}
      >
        {hasDocument ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Upload className="h-3.5 w-3.5" aria-hidden />}
        {hasDocument ? t("activeJobOrders.uploaded") : t("activeJobOrders.upload")}
      </button>
    </>
  );
}
