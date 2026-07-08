"use client";

import { Check } from "lucide-react";

export interface StepperStep {
  id: number;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

/**
 * Sharp/Enterprise step indicator, reusable anywhere a flow needs numbered
 * progress (not just Job Orders). Markers stay square (`rounded-none`) per the
 * design system — "modern" here comes from the progressive connector fill,
 * the active step's ring/shadow, and spacing/transitions, not from rounding
 * or color outside the existing `active`/`ink`/`muted`/`border` tokens.
 */
export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  const currentLabel = steps.find((step) => step.id === currentStep)?.label;

  return (
    <nav aria-label="Progress" className="rounded-none border border-border bg-card p-4 sm:p-5">
      <ol className="hidden items-center sm:flex">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const clickable = Boolean(onStepClick) && step.id <= currentStep;
          const status = isCompleted ? "complete" : isActive ? "current" : "upcoming";

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => clickable && onStepClick?.(step.id)}
                disabled={!clickable}
                aria-current={isActive ? "step" : undefined}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none border text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "border-active bg-active text-active-ink shadow-sm ring-2 ring-active/25 ring-offset-2 ring-offset-card"
                    : isCompleted
                      ? "border-active bg-active text-active-ink"
                      : "border-border bg-surface text-muted"
                } ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <span className="leading-none">{step.id}</span>
                )}
                <span className="sr-only">{` — ${status}`}</span>
              </button>

              <span
                className={`ml-2.5 text-sm whitespace-nowrap ${
                  isActive ? "font-semibold text-ink" : isCompleted ? "font-medium text-ink" : "text-muted"
                }`}
              >
                {step.label}
              </span>

              {idx < steps.length - 1 && (
                <span className="mx-4 h-0.5 flex-1 bg-border" aria-hidden>
                  <span
                    className={`block h-full transition-all duration-300 ${
                      isCompleted ? "w-full bg-active" : "w-0 bg-active"
                    }`}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: segmented progress bar (mirrors the desktop connector's fill language) + condensed current-step label. */}
      <div className="sm:hidden">
        <div className="flex items-center gap-1">
          {steps.map((step) => (
            <span
              key={step.id}
              aria-hidden
              className={`h-1.5 flex-1 rounded-none transition-colors duration-300 ${
                step.id <= currentStep ? "bg-active" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Step {currentStep} of {steps.length}
        </p>
        <p className="text-sm font-semibold text-ink">{currentLabel}</p>
      </div>
    </nav>
  );
}
