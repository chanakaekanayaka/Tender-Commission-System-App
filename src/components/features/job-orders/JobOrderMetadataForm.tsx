"use client";

import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { useTranslation } from "@/context/LanguageContext";
import type { JobOrderMetadata } from "@/shared/types/job-order.types";

interface JobOrderMetadataFormProps {
  metadata: JobOrderMetadata;
  onChange: (field: keyof JobOrderMetadata, value: string) => void;
}

/**
 * Auto-filled by Step 1's "Parse" action, but fully editable — the AI
 * extraction is a starting point, not a lock; the Staff/Admin creating the
 * job order can correct or add details manually before proceeding.
 */
export function JobOrderMetadataForm({ metadata, onChange }: JobOrderMetadataFormProps) {
  const { t } = useTranslation();

  return (
    <Card title={t("jobOrderCreate.metadataHeading")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={t("jobOrderCreate.address")}
          value={metadata.address}
          onChange={(value) => onChange("address", value)}
        />
        <FormField
          label={t("jobOrderCreate.telephone")}
          value={metadata.telephone}
          onChange={(value) => onChange("telephone", value)}
        />
        <FormField
          label={t("jobOrderCreate.email")}
          value={metadata.email}
          onChange={(value) => onChange("email", value)}
        />
        <FormField
          label={t("jobOrderCreate.note")}
          value={metadata.note}
          onChange={(value) => onChange("note", value)}
        />
      </div>
    </Card>
  );
}
