import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/SelectField";
import { useTranslation } from "@/context/LanguageContext";
import type { StaffOption } from "@/shared/types/job-order.types";

interface AssignStaffSelectProps {
  staffId: string;
  options: StaffOption[];
  onChange: (staffId: string) => void;
  /** Staff role sees its own assignment as read-only, not an editable dropdown (AGENTS.md Job Order §4). */
  disabled?: boolean;
}

export function AssignStaffSelect({ staffId, options, onChange, disabled = false }: AssignStaffSelectProps) {
  const { t } = useTranslation();

  return (
    <Card title={t("jobOrderCreate.assignToStaffHeading")}>
      <SelectField
        label={t("jobOrderCreate.assignToStaff")}
        value={staffId}
        options={options.map((opt) => ({ value: opt.id, label: opt.name }))}
        onChange={onChange}
        placeholder={t("jobOrderCreate.selectStaff")}
        disabled={disabled}
      />
    </Card>
  );
}
