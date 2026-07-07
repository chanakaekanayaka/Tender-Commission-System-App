"use client";

import { useState } from "react";
import { T } from "@/components/features/i18n/T";
import { DocumentDropzone } from "@/components/features/tenders/DocumentDropzone";
import { PriceScheduleMetadataForm } from "@/components/features/tenders/PriceScheduleMetadataForm";
import { LineItemsTable } from "@/components/features/tenders/LineItemsTable";
import type { PriceScheduleLineItem, PriceScheduleMetadata } from "@/shared/types/tender.types";

const todayISO = () => new Date().toISOString().slice(0, 10);

// Placeholder for the real Gemini extraction pipeline (AI_INSTRUCTIONS.md Workflow A).
// No backend call exists yet — "Parse" just fills in fixed sample data after a delay
// so the loading state has something to show in this UI-only pass. Uploading Date is
// a system timestamp, not an AI-extracted field, so Parse never touches it.
const PARSED_METADATA: Omit<PriceScheduleMetadata, "uploadingDate"> = {
  procurementNo: "PROC/2026/0148",
  procurementTitle: "Supply of Surgical & Ward Consumables",
  procuringEntity: "Ministry of Health",
  closingDate: "2026-07-21",
};

const PARSED_LINE_ITEMS: PriceScheduleLineItem[] = [
  { id: "1", item: "Surgical gloves, nitrile, box 100", qty: 500, unitPrice: 1250 },
  { id: "2", item: "Examination table, adjustable", qty: 12, unitPrice: 84_000 },
  { id: "3", item: "IV stands, stainless steel", qty: 40, unitPrice: 6500 },
];

export function TenderCreateForm() {
  const [metadata, setMetadata] = useState<PriceScheduleMetadata>(() => ({
    procurementNo: "",
    procurementTitle: "",
    procuringEntity: "",
    closingDate: "",
    uploadingDate: todayISO(),
  }));
  const [lineItems, setLineItems] = useState<PriceScheduleLineItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = () => {
    setIsParsing(true);
    setTimeout(() => {
      setMetadata((prev) => ({ ...prev, ...PARSED_METADATA }));
      setLineItems(PARSED_LINE_ITEMS);
      setIsParsing(false);
    }, 1200);
  };

  return (
    <>
      {/* Dropzone stacks above metadata on mobile; side-by-side (2fr/3fr) from lg up */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <DocumentDropzone onParse={handleParse} isParsing={isParsing} />
        <PriceScheduleMetadataForm values={metadata} />
      </div>

      <LineItemsTable items={lineItems} />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
        >
          <T k="tenders.saveDraft" />
        </button>
        <button
          type="button"
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink"
        >
          <T k="tenders.savePriceSchedule" />
        </button>
      </div>
    </>
  );
}
