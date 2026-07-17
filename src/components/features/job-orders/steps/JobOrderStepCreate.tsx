"use client";

import { JobOrderDocumentDropzone } from "@/components/features/job-orders/JobOrderDocumentDropzone";
import { AssignStaffSelect } from "@/components/features/job-orders/AssignStaffSelect";
import { JobOrderLineItemsTable } from "@/components/features/job-orders/JobOrderLineItemsTable";
import { JobOrderMetadataForm } from "@/components/features/job-orders/JobOrderMetadataForm";
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
    updateMetadataField,
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
          <JobOrderDocumentDropzone onParse={handleParse} isParsing={isParsing} />
          {!procurementNo && (
            <p className="text-xs text-muted">{t("jobOrderCreate.selectProcurementFirst")}</p>
          )}
        </div>

        <JobOrderMetadataForm metadata={metadata} onChange={updateMetadataField} />
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
