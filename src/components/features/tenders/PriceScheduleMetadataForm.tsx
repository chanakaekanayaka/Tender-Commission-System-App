import type { ReactNode } from "react";
import { T } from "@/components/features/i18n/T";
import type { PriceScheduleMetadata } from "@/shared/types/tender.types";

type EditableField = "procurementNo" | "procurementTitle" | "procuringEntity" | "closingDate";

interface FieldProps {
  label: ReactNode;
  value: string;
  required?: boolean;
  readOnly?: boolean;
  type?: "text" | "date";
  onChange?: (value: string) => void;
}

function Field({ label, value, required, readOnly = false, type = "text", onChange }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="text-muted">
        {label}
        {required && <span className="text-ink"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`mt-1 block w-full rounded-none border border-border px-3 py-2 ${
          readOnly ? "bg-surface text-muted" : "bg-card text-ink"
        }`}
      />
    </label>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

interface PriceScheduleMetadataFormProps {
  values: PriceScheduleMetadata;
  onChange: (field: EditableField, value: string) => void;
}

/** OCR extraction is best-effort (cheapest Textract tier, varying tender doc layouts) — every field
 *  except the system-generated Uploading Date must be editable so mistakes are correctable. */
export function PriceScheduleMetadataForm({ values, onChange }: PriceScheduleMetadataFormProps) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        <T k="metadataForm.heading" />
      </p>

      <div className="space-y-4">
        <Row>
          <Field
            label={<T k="common.procurementNo" />}
            value={values.procurementNo}
            required
            onChange={(v) => onChange("procurementNo", v)}
          />
          <Field
            label={<T k="metadataForm.procurementTitle" />}
            value={values.procurementTitle}
            onChange={(v) => onChange("procurementTitle", v)}
          />
        </Row>
        <Row>
          <Field
            label={<T k="common.procuringEntity" />}
            value={values.procuringEntity}
            onChange={(v) => onChange("procuringEntity", v)}
          />
          <Field
            label={<T k="common.closingDate" />}
            value={values.closingDate}
            type="date"
            onChange={(v) => onChange("closingDate", v)}
          />
        </Row>
        <Row>
          <Field label={<T k="metadataForm.uploadingDate" />} value={values.uploadingDate} readOnly />
        </Row>
      </div>
    </div>
  );
}
