import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/SelectField";
import { useTranslation } from "@/context/LanguageContext";
import type { StaffOption } from "@/shared/types/job-order.types";

interface AssignStaffSelectProps {
  staffId: string;
  options: StaffOption[];
  onChange: (staffId: string) => void;
  /** Staff role sees its own assignment as a plain name, not a dropdown at all — there's nothing
   *  for them to pick, it's always themselves (AGENTS.md Job Order §4). */
  disabled?: boolean;
  isLoading?: boolean;
}

export function AssignStaffSelect({
  staffId,
  options,
  onChange,
  disabled = false,
  isLoading = false,
}: AssignStaffSelectProps) {
  const { t } = useTranslation();

  if (disabled) {
    const staffName = options.find((opt) => opt.id === staffId)?.name ?? "";
    return (
      <Card title={t("jobOrderCreate.assignToStaffHeading")}>
        <p className="text-sm text-ink">{staffName}</p>
      </Card>
    );
  }

  return (
    <Card title={t("jobOrderCreate.assignToStaffHeading")}>
      <SelectField
        label={t("jobOrderCreate.assignToStaff")}
        value={staffId}
        options={options.map((opt) => ({ value: opt.id, label: opt.name }))}
        onChange={onChange}
        placeholder={isLoading ? t("jobOrderCreate.loadingStaff") : t("jobOrderCreate.selectStaff")}
      />
    </Card>
  );
}
