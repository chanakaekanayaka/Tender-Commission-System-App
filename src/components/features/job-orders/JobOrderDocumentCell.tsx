import { Eye, FileText } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface JobOrderDocumentCellProps {
  documentName?: string;
  onPreview: () => void;
}

/** "Uploaded Document" column — link/view affordance once Staff has attached a file, muted placeholder until then. */
export function JobOrderDocumentCell({ documentName, onPreview }: JobOrderDocumentCellProps) {
  const { t } = useTranslation();

  if (!documentName) {
    return <span className="text-sm text-muted">{t("activeJobOrders.notUploaded")}</span>;
  }

  return (
    <button
      type="button"
      onClick={onPreview}
      className="flex items-center gap-1.5 text-sm text-ink underline decoration-border underline-offset-2 hover:text-active"
    >
      <FileText className="h-4 w-4 text-muted" aria-hidden />
      <span className="max-w-[10rem] truncate">{documentName}</span>
      <Eye className="h-3.5 w-3.5 text-muted" aria-hidden />
    </button>
  );
}
