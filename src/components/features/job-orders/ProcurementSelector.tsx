import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { T } from "@/components/features/i18n/T";
import { useTranslation } from "@/context/LanguageContext";
import type { ProcurementOption } from "@/shared/types/job-order.types";

interface ProcurementSelectorProps {
  procurementNo: string;
  options: ProcurementOption[];
  onSelect: (procurementNo: string) => void;
}

export function ProcurementSelector({ procurementNo, options, onSelect }: ProcurementSelectorProps) {
  const { t } = useTranslation();
  const selected = options.find((opt) => opt.procurementNo === procurementNo);

  return (
    <Card title={<T k="jobOrderCreate.procurementHeading" />}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label={<T k="common.procurementNo" />}
          value={procurementNo}
          options={options.map((opt) => ({ value: opt.procurementNo, label: opt.procurementNo }))}
          onChange={onSelect}
          placeholder={t("jobOrderCreate.selectProcurement")}
        />
        <FormField label={<T k="common.procuringEntity" />} value={selected?.procuringEntity ?? ""} disabled />
      </div>

      {selected && <p className="mt-3 text-sm text-ink">{selected.procurementTitle}</p>}
    </Card>
  );
}
