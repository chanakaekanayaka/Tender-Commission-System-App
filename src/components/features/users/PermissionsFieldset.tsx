"use client";

import { Toggle } from "@/components/ui/Toggle";
import { useTranslation } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/locales";
import type { UserPermissions } from "@/shared/types/user.types";

const PERMISSION_FIELDS: { key: keyof UserPermissions; labelKey: TranslationKey }[] = [
  { key: "canCreateJobOrders", labelKey: "userForm.permCreateJobOrders" },
  { key: "canViewPriceSchedules", labelKey: "userForm.permViewPriceSchedules" },
  { key: "canApproveExpenses", labelKey: "userForm.permApproveExpenses" },
  { key: "canManageUsers", labelKey: "userForm.permManageUsers" },
];

interface PermissionsFieldsetProps {
  permissions: UserPermissions;
  onChange: (permissions: UserPermissions) => void;
}

/** Checkbox group restricting a Staff account's system access — each toggle maps 1:1 to a section shown live in UserAccessPreview. */
export function PermissionsFieldset({ permissions, onChange }: PermissionsFieldsetProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {PERMISSION_FIELDS.map(({ key, labelKey }) => (
        <Toggle
          key={key}
          label={t(labelKey)}
          checked={permissions[key]}
          onChange={(checked) => onChange({ ...permissions, [key]: checked })}
        />
      ))}
    </div>
  );
}
