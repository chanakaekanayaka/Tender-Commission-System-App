"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { useEffect } from "react";

export interface ToastState {
  message: string;
  variant: "success" | "error";
}

interface ToastProps extends ToastState {
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. */
  duration?: number;
}

/** Fixed bottom-right notification, auto-dismissing — no toast library in this project, so this is
 *  a small self-contained replacement for the inline saveError/savedMessage paragraphs. */
export function Toast({ message, variant, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const isError = variant === "error";

  return (
    <div
      role="status"
      className={`fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-2 rounded-none border p-4 shadow-lg ${
        isError ? "border-red-600 bg-red-50 text-red-900" : "border-green-600 bg-green-50 text-green-900"
      }`}
    >
      {isError ? (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      )}
      <p className="text-sm font-medium">{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="ml-auto shrink-0">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
