import { Pencil } from "lucide-react";
import type { ReactNode } from "react";

// Server Component — these are plain uncontrolled inputs, so no client-side
// state or handlers are needed just to render and type into them.

interface FieldProps {
  label: string;
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
          name={label}
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
        Metadata (auto-filled by AI · editable)
      </p>

      <div className="space-y-4">
        <Row>
          <Field label="Procurement No" defaultValue="PROC/2026/0148" required />
          <Field label="Procuring Entity" defaultValue="Ministry of Health" />
        </Row>
        <Row>
          <Field label="Closing Date" defaultValue="2026-07-21" />
          <Field label="Delivery Period" defaultValue="45 days" />
        </Row>
        <Row>
          <Field label="Bid Validity" defaultValue="90 days" />
          <Field label="VAT Mode" defaultValue="15% — from System Config" editable={false} />
        </Row>
      </div>
    </div>
  );
}
