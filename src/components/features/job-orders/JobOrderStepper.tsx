"use client";

import { Stepper } from "@/components/ui/Stepper";
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
}

function JobOrderStepperContent() {
  const { t } = useTranslation();
  const { step, goToStep, goNext, goBack, canProceedFromStep1, procurementNo } = useJobOrderWizard();

  const steps = [
    { id: 1, label: t("jobOrderCreate.step1Label") },
    { id: 2, label: t("jobOrderCreate.step2Label") },
    { id: 3, label: t("jobOrderCreate.step3Label") },
  ];

  const handleSaveDraft = () => {
    // TODO: POST the in-progress wizard state to the backend once a Job Orders
    // draft API exists — this is a UI-only mock phase (AGENTS.md).
    console.log("Save draft — job order wizard state is not yet persisted to a backend.");
  };

  const handleSubmit = () => {
    // TODO: POST the completed job order once that route exists.
    console.log("Create job order — no backend wired up yet.");
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
            className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
          >
            {t("jobOrderCreate.saveDraft")}
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
              disabled={!procurementNo}
              className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("jobOrderCreate.createJobOrder")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function JobOrderStepper({ role, initialStep }: JobOrderStepperProps) {
  return (
    <JobOrderWizardProvider role={role} initialStep={initialStep}>
      <JobOrderStepperContent />
    </JobOrderWizardProvider>
  );
}
