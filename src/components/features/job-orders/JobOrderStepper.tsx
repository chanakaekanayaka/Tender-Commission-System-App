"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { Toast, type ToastState } from "@/components/ui/Toast";
import {
  JobOrderWizardProvider,
  useJobOrderWizard,
} from "@/components/features/job-orders/JobOrderWizardContext";
import { JobOrderStepCreate } from "@/components/features/job-orders/steps/JobOrderStepCreate";
import { JobOrderStepMarkup } from "@/components/features/job-orders/steps/JobOrderStepMarkup";
import { JobOrderStepReceipts } from "@/components/features/job-orders/steps/JobOrderStepReceipts";
import { useTranslation } from "@/context/LanguageContext";

interface JobOrderStepperProps {
  role: "admin" | "staff";
  initialStep?: number;
  jobOrderId?: string;
}

function JobOrderStepperContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    role,
    step,
    goToStep,
    goNext,
    goBack,
    canProceedFromStep1,
    procurementNo,
    isLoadingJobOrder,
    isSavingDraft,
    saveDraft,
    isCompleting,
    completeJobOrder,
    markupValue,
  } = useJobOrderWizard();
  const [toast, setToast] = useState<ToastState | null>(null);

  if (isLoadingJobOrder) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-none border border-border bg-card p-10 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("jobOrderCreate.loadingJobOrder")}
      </div>
    );
  }

  const steps = [
    { id: 1, label: t("jobOrderCreate.step1Label") },
    { id: 2, label: t("jobOrderCreate.step2Label") },
    { id: 3, label: t("jobOrderCreate.step3Label") },
  ];

  const handleSaveDraft = async () => {
    const result = await saveDraft();
    setToast({
      message: result.success ? t("jobOrderCreate.draftSaved") : result.message,
      variant: result.success ? "success" : "error",
    });
  };

  const handleSubmit = async () => {
    // Markup left at 0 is almost always a forgotten field, not an intentional "no markup" — unlike
    // Commission, there's no explicit "set to 0" opt-in for it, so a 0 here blocks completion
    // instead of silently letting a job order through with negative profit baked in.
    if (markupValue <= 0) {
      setToast({ message: t("jobOrderCreate.markupRequired"), variant: "error" });
      return;
    }

    const result = await completeJobOrder();
    if (result.success) {
      router.push(`/${role}/job-orders/active`);
      return;
    }
    setToast({ message: result.message, variant: "error" });
  };

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentStep={step} onStepClick={goToStep} />

      {step === 1 && <JobOrderStepCreate />}
      {step === 2 && <JobOrderStepReceipts />}
      {step === 3 && <JobOrderStepMarkup />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
            >
              {t("common.back")}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!procurementNo || isSavingDraft || isCompleting}
            className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingDraft ? t("jobOrderCreate.savingDraft") : t("jobOrderCreate.saveDraft")}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={step === 1 && !canProceedFromStep1}
              className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("jobOrderCreate.nextStep", { label: steps[step].label })}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!procurementNo || isSavingDraft || isCompleting}
              className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCompleting ? t("jobOrderCreate.creatingJobOrder") : t("jobOrderCreate.createJobOrder")}
            </button>
          )}
        </div>
      </div>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export function JobOrderStepper({ role, initialStep, jobOrderId }: JobOrderStepperProps) {
  return (
    <JobOrderWizardProvider role={role} initialStep={initialStep} jobOrderId={jobOrderId}>
      <JobOrderStepperContent />
    </JobOrderWizardProvider>
  );
}
