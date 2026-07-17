"use client";

import { useState } from "react";
import { T } from "@/components/features/i18n/T";
import { useTranslation } from "@/context/LanguageContext";
import { DocumentDropzone, type ExtractResult } from "@/components/features/tenders/DocumentDropzone";
import { PriceScheduleMetadataForm } from "@/components/features/tenders/PriceScheduleMetadataForm";
import { LineItemsTable } from "@/components/features/tenders/LineItemsTable";
import type {
  PriceScheduleLineItem,
  PriceScheduleMetadata,
  PriceScheduleSourceDocument,
} from "@/shared/types/tender.types";

const todayISO = () => new Date().toISOString().slice(0, 10);

function emptyMetadata(): PriceScheduleMetadata {
  return {
    procurementNo: "",
    procurementTitle: "",
    procuringEntity: "",
    closingDate: "",
    uploadingDate: todayISO(),
  };
}

interface TenderCreateFormProps {
  /** Real System Config VAT rate (0 if not VAT-registered), fetched server-side by the page. */
  vatRate: number;
}

export function TenderCreateForm({ vatRate }: TenderCreateFormProps) {
  const { t } = useTranslation();
  const [metadata, setMetadata] = useState<PriceScheduleMetadata>(emptyMetadata);
  const [lineItems, setLineItems] = useState<PriceScheduleLineItem[]>([]);
  const [sourceDocument, setSourceDocument] = useState<PriceScheduleSourceDocument | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleExtracted = (result: ExtractResult) => {
    setMetadata((prev) => ({ ...prev, ...result.metadata }));
    setLineItems(result.lineItems);
    setSourceDocument(result.sourceDocument);
    setSavedMessage(null);
  };

  const handleMetadataChange = (field: keyof Omit<PriceScheduleMetadata, "uploadingDate">, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
    setSavedMessage(null);
  };

  const handleSave = async (status: "Draft" | "Completed") => {
    setIsSaving(true);
    setSaveError(null);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/price-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procurementNo: metadata.procurementNo,
          procurementTitle: metadata.procurementTitle,
          procuringEntity: metadata.procuringEntity,
          closingDate: metadata.closingDate,
          lineItems: lineItems.map(({ item, qty, unitPrice }) => ({ item, qty, unitPrice })),
          status,
          sourceDocument,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to save the price schedule.");
      }

      setMetadata(emptyMetadata());
      setLineItems([]);
      setSourceDocument(undefined);
      setSavedMessage(status === "Draft" ? t("tenders.draftSaved") : t("tenders.priceScheduleSaved"));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save the price schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Dropzone stacks above metadata on mobile; side-by-side (2fr/3fr) from lg up */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <DocumentDropzone onExtracted={handleExtracted} />
        <PriceScheduleMetadataForm values={metadata} onChange={handleMetadataChange} />
      </div>

      <LineItemsTable items={lineItems} onChange={setLineItems} vatRate={vatRate} />

      {saveError && <p className="text-sm text-ink">{saveError}</p>}
      {savedMessage && <p className="text-sm text-ink">{savedMessage}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => handleSave("Draft")}
          disabled={isSaving}
          className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <T k="tenders.saveDraft" />
        </button>
        <button
          type="button"
          onClick={() => handleSave("Completed")}
          disabled={isSaving}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <T k="tenders.savePriceSchedule" />
        </button>
      </div>
    </>
  );
}
