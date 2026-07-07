import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import type { JobOrderStatus } from "@/shared/types/job-order.types";

interface AdminJobOrderActionsProps {
  status: JobOrderStatus;
  onVerify: () => void;
}

/**
 * Admin-only row action. "Verify" only becomes available once Staff has
 * uploaded the bill document (status = "Bill Created") — there's nothing to
 * verify while still "Pending", and it's a no-op once already "Verified".
 */
export function AdminJobOrderActions({ status, onVerify }: AdminJobOrderActionsProps) {
  const { t } = useTranslation();

  if (status === "Verified") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        {t("activeJobOrders.verified")}
      </span>
    );
  }

  if (status === "Pending") {
    return <span className="text-xs text-muted">{t("activeJobOrders.awaitingDocument")}</span>;
  }

  return (
    <button
      type="button"
      onClick={onVerify}
      className="flex items-center gap-1.5 rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90"
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      {t("activeJobOrders.verify")}
    </button>
  );
}
