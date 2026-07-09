"use client";

import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";
import { formatLKR } from "@/lib/utils/currency";

interface PaymentReminderEmailModalProps {
  jobOrderNo: string;
  procurementNo: string;
  billAmount: number;
  dueDateLabel: string;
  toEmail: string;
  onClose: () => void;
}

/**
 * Mounted only while a row's "Email" action is active (see AdminPendingTable) so every
 * open starts from fresh, row-specific field state instead of carrying over the previous
 * row's edits.
 */
export function PaymentReminderEmailModal({
  jobOrderNo,
  procurementNo,
  billAmount,
  dueDateLabel,
  toEmail,
  onClose,
}: PaymentReminderEmailModalProps) {
  const { t } = useTranslation();
  const [to, setTo] = useState(toEmail);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [message, setMessage] = useState(() =>
    t("jobOrderPending.emailTemplate", {
      jobOrderNo,
      procurementNo,
      billAmount: formatLKR(billAmount),
      dueDate: dueDateLabel,
      companyName: defaultSystemConfig.companyName,
    }),
  );
  const [sentAt, setSentAt] = useState<number | null>(null);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    // TODO: POST /api/job-orders/payment-reminder-email once that route exists — UI-only
    // mock phase (AGENTS.md).
    console.log("Send payment overdue email", { jobOrderNo, to, cc, bcc, message });
    setSentAt(Date.now());
  };

  return (
    <Modal open onClose={onClose} title={t("jobOrderPending.emailModalTitle", { jobOrderNo })}>
      <form onSubmit={handleSend} className="space-y-3">
        <FormField label={t("jobOrderPending.emailTo")} value={to} onChange={setTo} />
        <FormField label={t("jobOrderPending.emailCc")} value={cc} onChange={setCc} />
        <FormField label={t("jobOrderPending.emailBcc")} value={bcc} onChange={setBcc} />

        <label className="block text-sm">
          <span className="text-muted">{t("jobOrderPending.emailMessage")}</span>
          <textarea
            required
            rows={9}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full rounded-none border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-active focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {sentAt && <span className="text-xs text-muted">{t("jobOrderPending.emailSent", { to })}</span>}
          <button type="submit" className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink">
            {t("jobOrderPending.emailSend")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
