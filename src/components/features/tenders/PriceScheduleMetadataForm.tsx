import type { ReactNode } from "react";
import { T } from "@/components/features/i18n/T";
import type { PriceScheduleMetadata } from "@/shared/types/tender.types";

type EditableField = "procurementNo" | "procurementTitle" | "procuringEntity";

interface FieldProps {
  label: ReactNode;
  value: string;
  required?: boolean;
  readOnly?: boolean;
  highlighted?: boolean;
  onChange?: (value: string) => void;
}

function Field({ label, value, required, readOnly = false, highlighted = false, onChange }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className={highlighted ? "text-black" : "text-muted"}>
        {label}
        {required && <span className={highlighted ? "text-black" : "text-ink"}> *</span>}
      </span>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`mt-1 block w-full rounded-none border border-border px-3 py-2 ${
          highlighted
            ? "bg-white text-black"
            : readOnly
              ? "bg-surface text-muted"
              : "bg-card text-ink"
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
  /** True once a document has been parsed — highlights the section so it's obvious the fields were AI-filled. */
  isParsed?: boolean;
}

/** OCR extraction is best-effort (cheapest Textract tier, varying tender doc layouts) — every field
 *  except the system-generated Uploading Date and Submitted Date must be editable so mistakes are
 *  correctable. */
export function PriceScheduleMetadataForm({ values, onChange, isParsed = false }: PriceScheduleMetadataFormProps) {
  return (
    <div
      className={`rounded-none border border-border p-4 ${isParsed ? "bg-[#AAFF00]" : "bg-card"}`}
    >
      <p
        className={`mb-3 text-xs font-semibold tracking-wide uppercase ${
          isParsed ? "text-black" : "text-muted"
        }`}
      >
        <T k="metadataForm.heading" />
      </p>

      <div className="space-y-4">
        <Row>
          <Field
            label={<T k="common.procurementNo" />}
            value={values.procurementNo}
            required
            highlighted={isParsed}
            onChange={(v) => onChange("procurementNo", v)}
          />
          <Field
            label={<T k="metadataForm.procurementTitle" />}
            value={values.procurementTitle}
            highlighted={isParsed}
            onChange={(v) => onChange("procurementTitle", v)}
          />
        </Row>
        <Row>
          <Field
            label={<T k="common.procuringEntity" />}
            value={values.procuringEntity}
            highlighted={isParsed}
            onChange={(v) => onChange("procuringEntity", v)}
          />
          <Field label={<T k="common.closingDate" />} value={values.closingDate} readOnly highlighted={isParsed} />
        </Row>
        <Row>
          <Field
            label={<T k="metadataForm.uploadingDate" />}
            value={values.uploadingDate}
            readOnly
            highlighted={isParsed}
          />
        </Row>
      </div>
    </div>
  );
}
