import type { ReactNode } from "react";
import { T } from "@/components/features/i18n/T";
import type { PriceScheduleMetadata } from "@/shared/types/tender.types";

interface FieldProps {
  label: ReactNode;
  value: string;
  required?: boolean;
}

function Field({ label, value, required }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="text-muted">
        {label}
        {required && <span className="text-ink"> *</span>}
      </span>
      <input
        type="text"
        value={value}
        readOnly
        className="mt-1 block w-full rounded-none border border-border bg-surface px-3 py-2 text-muted"
      />
    </label>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

interface PriceScheduleMetadataFormProps {
  values: PriceScheduleMetadata;
}

export function PriceScheduleMetadataForm({ values }: PriceScheduleMetadataFormProps) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
        <T k="metadataForm.heading" />
      </p>

      <div className="space-y-4">
        <Row>
          <Field label={<T k="common.procurementNo" />} value={values.procurementNo} required />
          <Field label={<T k="metadataForm.procurementTitle" />} value={values.procurementTitle} />
        </Row>
        <Row>
          <Field label={<T k="common.procuringEntity" />} value={values.procuringEntity} />
          <Field label={<T k="common.closingDate" />} value={values.closingDate} />
        </Row>
        <Row>
          <Field label={<T k="metadataForm.uploadingDate" />} value={values.uploadingDate} />
        </Row>
      </div>
    </div>
  );
}
