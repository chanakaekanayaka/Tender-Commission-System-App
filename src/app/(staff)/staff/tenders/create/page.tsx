import { DocumentDropzone } from "@/components/features/tenders/DocumentDropzone";
import { PriceScheduleMetadataForm } from "@/components/features/tenders/PriceScheduleMetadataForm";
import { LineItemsTable } from "@/components/features/tenders/LineItemsTable";

export default function CreatePriceSchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">New Price Schedule</h1>
      </div>

      {/* Dropzone stacks above metadata on mobile; side-by-side (2fr/3fr) from lg up */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <DocumentDropzone />
        <PriceScheduleMetadataForm />
      </div>

      <LineItemsTable />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
        >
          Save Draft
        </button>
        <button
          type="button"
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink"
        >
          Save Price Schedule →
        </button>
      </div>
    </div>
  );
}
