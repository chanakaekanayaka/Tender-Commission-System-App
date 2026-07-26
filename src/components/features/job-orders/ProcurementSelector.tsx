import { Card } from "@/components/ui/Card";
import { SearchableSelectField } from "@/components/ui/SearchableSelectField";
import { T } from "@/components/features/i18n/T";
import { useTranslation } from "@/context/LanguageContext";
import type { ProcurementOption } from "@/shared/types/job-order.types";

interface ProcurementSelectorProps {
  procurementNo: string;
  options: ProcurementOption[];
  isLoading?: boolean;
  onSelect: (procurementNo: string) => void;
}

/** Procurement No and Procuring Entity are shown together as one combined option label — no
 *  separate (and, until selected, always-blank) Procuring Entity field alongside it. */
export function ProcurementSelector({ procurementNo, options, isLoading = false, onSelect }: ProcurementSelectorProps) {
  const { t } = useTranslation();
  const selected = options.find((opt) => opt.procurementNo === procurementNo);

  return (
    <Card title={<T k="jobOrderCreate.procurementHeading" />}>
      <SearchableSelectField
        label={<T k="common.procurementNo" />}
        value={procurementNo}
        options={options.map((opt) => ({
          value: opt.procurementNo,
          label: `${opt.procurementNo} — ${opt.procuringEntity}`,
        }))}
        onChange={onSelect}
        placeholder={isLoading ? t("jobOrderCreate.loadingProcurements") : t("jobOrderCreate.selectProcurement")}
        noMatchesLabel={t("jobOrderCreate.noProcurementMatches")}
      />

      {selected && <p className="mt-3 text-sm text-ink">{selected.procurementTitle}</p>}
    </Card>
  );
}
