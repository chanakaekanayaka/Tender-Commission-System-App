"use client";

import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { DocumentDropzone } from "@/components/features/tenders/DocumentDropzone";
import { AssignStaffSelect } from "@/components/features/job-orders/AssignStaffSelect";
import { JobOrderLineItemsTable } from "@/components/features/job-orders/JobOrderLineItemsTable";
import { ProcurementSelector } from "@/components/features/job-orders/ProcurementSelector";
import { useJobOrderWizard } from "@/components/features/job-orders/JobOrderWizardContext";
import { useTranslation } from "@/context/LanguageContext";

export function JobOrderStepCreate() {
  const { t } = useTranslation();
  const {
    role,
    procurementNo,
    procurementOptionsList,
    handleSelectProcurement,
    metadata,
    isParsing,
    handleParse,
    items,
    handleRemoveItem,
    assignedStaffId,
    setAssignedStaffId,
    staffOptionsList,
  } = useJobOrderWizard();
  const isAdmin = role === "admin";

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <ProcurementSelector
          procurementNo={procurementNo}
          options={procurementOptionsList}
          onSelect={handleSelectProcurement}
        />
        <AssignStaffSelect
          staffId={assignedStaffId}
          options={staffOptionsList}
          onChange={setAssignedStaffId}
          disabled={!isAdmin}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-2">
          <DocumentDropzone onParse={handleParse} isParsing={isParsing} />
          {!procurementNo && (
            <p className="text-xs text-muted">{t("jobOrderCreate.selectProcurementFirst")}</p>
          )}
        </div>

        <Card title={t("metadataForm.heading")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t("jobOrderCreate.address")} value={metadata.address} disabled />
            <FormField label={t("jobOrderCreate.telephone")} value={metadata.telephone} disabled />
            <FormField label={t("jobOrderCreate.email")} value={metadata.email} disabled />
            <FormField label={t("jobOrderCreate.note")} value={metadata.note} disabled />
          </div>
        </Card>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          {t("jobOrderCreate.lineItemsHeading")}
        </p>
        <JobOrderLineItemsTable items={items} onRemove={handleRemoveItem} />
      </div>
    </>
  );
}
