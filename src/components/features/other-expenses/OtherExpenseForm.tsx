"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

interface UploadedReceipt {
  fileName: string;
  fileType: string;
  s3Key: string;
}

/** Staff submitting a new standalone expense for reimbursement — real S3 upload for the receipt
 *  (uploaded immediately on choosing the file, same pattern as PaymentProofUploadCell), then a
 *  real POST /api/other-expenses on Save. Always starts "Pending" until Admin reviews it. */
export function OtherExpenseForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receipt, setReceipt] = useState<UploadedReceipt | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = description.trim() !== "" && amount > 0 && !isUploading && !isSaving;

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setToast({ message: t("otherExpenses.invalidFileType"), variant: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/other-expenses/receipt", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to upload receipt.");
      }
      setReceipt({ fileName: result.data.fileName, fileType: result.data.fileType, s3Key: result.data.s3Key });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to upload receipt.", variant: "error" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/other-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount, date, receipt }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to save expense.");
      }

      setToast({ message: t("otherExpenses.saved"), variant: "success" });
      setDescription("");
      setAmount(0);
      setReceipt(null);
      router.push("/staff/expenses/pending");
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to save expense.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title={t("otherExpenses.createHeading")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label={t("otherExpenses.description")} value={description} onChange={setDescription} />
          </div>
          <FormField
            label={t("otherExpenses.amount")}
            value={amount}
            onChange={(v) => setAmount(Math.max(0, Number(v) || 0))}
            type="number"
            min={0}
            suffix="Rs"
          />
          <FormField label={t("otherExpenses.date")} value={date} onChange={setDate} type="date" />

          <div className="sm:col-span-2">
            <p className="mb-1 text-sm text-muted">{t("otherExpenses.receipt")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Paperclip className="h-3.5 w-3.5" aria-hidden />
                )}
                {isUploading ? t("otherExpenses.uploadingReceipt") : t("otherExpenses.chooseReceipt")}
              </button>
              <span className="text-xs text-muted">{receipt?.fileName ?? t("otherExpenses.noReceiptChosen")}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? t("otherExpenses.saving") : t("otherExpenses.save")}
        </button>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </form>
  );
}
