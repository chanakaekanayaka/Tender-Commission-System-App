import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { T } from "@/components/features/i18n/T";

// Server Component — these are plain uncontrolled inputs, so no client-side
// state or handlers are needed just to render and type into them. Field
// labels go through <T/> (the sole client leaf) so this stays server-rendered.

interface FieldProps {
  label: ReactNode;
  defaultValue: string;
  required?: boolean;
  editable?: boolean;
}

function Field({ label, defaultValue, required, editable = true }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="text-muted">
        {label}
        {required && <span className="text-ink"> *</span>}
      </span>
      <span className="relative mt-1 block">
        <input
          type="text"
          defaultValue={defaultValue}
          readOnly={!editable}
          className={`w-full rounded-none border border-border bg-surface px-3 py-2 pr-8 text-ink ${
            !editable ? "text-muted" : ""
          }`}
        />
        {editable && (
          <Pencil
            className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
        )}
      </span>
    </label>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

export function PriceScheduleMetadataForm() {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        <T k="metadataForm.heading" />
      </p>

      <div className="space-y-4">
        <Row>
          <Field label={<T k="common.procurementNo" />} defaultValue="PROC/2026/0148" required />
          <Field label={<T k="common.procuringEntity" />} defaultValue="Ministry of Health" />
        </Row>
        <Row>
          <Field label={<T k="common.closingDate" />} defaultValue="2026-07-21" />
          <Field label={<T k="metadataForm.deliveryPeriod" />} defaultValue="45 days" />
        </Row>
        <Row>
          <Field label={<T k="metadataForm.bidValidity" />} defaultValue="90 days" />
          <Field
            label={<T k="metadataForm.vatMode" />}
            defaultValue="15% — from System Config"
            editable={false}
          />
        </Row>
      </div>
    </div>
  );
}
