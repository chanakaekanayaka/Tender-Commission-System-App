"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { T } from "@/components/features/i18n/T";
import { Toast, type ToastState } from "@/components/ui/Toast";
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
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleExtracted = (result: ExtractResult) => {
    setMetadata((prev) => ({ ...prev, ...result.metadata }));
    setLineItems(result.lineItems);
    setSourceDocument(result.sourceDocument);
  };

  const handleMetadataChange = (field: keyof Omit<PriceScheduleMetadata, "uploadingDate">, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setToast(null);

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
          status: "Completed",
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
      setToast({ message: t("tenders.priceScheduleSaved"), variant: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to save the price schedule.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Dropzone stacks above metadata on mobile; side-by-side (2fr/3fr) from lg up */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <DocumentDropzone onExtracted={handleExtracted} />
        <PriceScheduleMetadataForm values={metadata} onChange={handleMetadataChange} isParsed={!!sourceDocument} />
      </div>

      <LineItemsTable items={lineItems} vatRate={vatRate} />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          <T k="tenders.save" />
        </button>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </>
  );
}
