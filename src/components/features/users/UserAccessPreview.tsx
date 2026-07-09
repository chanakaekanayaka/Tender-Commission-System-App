"use client";

import { useTranslation } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/locales";
import type { UserPermissions } from "@/shared/types/user.types";

const PREVIEW_ITEMS: { labelKey: TranslationKey; enabledBy?: keyof UserPermissions }[] = [
  { labelKey: "sidebar.dashboard" },
  { labelKey: "sidebar.priceSchedules", enabledBy: "canViewPriceSchedules" },
  { labelKey: "sidebar.jobOrders", enabledBy: "canCreateJobOrders" },
  { labelKey: "sidebar.otherExpenses", enabledBy: "canApproveExpenses" },
  { labelKey: "sidebar.systemConfigs", enabledBy: "canManageUsers" },
];

interface UserAccessPreviewProps {
  permissions: UserPermissions;
}

/**
 * Live read-only preview of this Staff account's sidebar, derived purely from
 * the permission toggles — there is no auth/session yet (AGENTS.md UI-only
 * mock phase), so this is the only place the "restricted sections get
 * disabled/hidden" behavior can be demonstrated in the frontend today.
 */
export function UserAccessPreview({ permissions }: UserAccessPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-none border border-border bg-sidebar p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-sidebar-muted uppercase">
        {t("userForm.accessPreviewHeading")}
      </p>
      <ul className="space-y-1.5 text-sm">
        {PREVIEW_ITEMS.map((item) => {
          const visible = !item.enabledBy || permissions[item.enabledBy];
          return (
            <li
              key={item.labelKey}
              className={visible ? "text-sidebar-ink" : "text-sidebar-muted line-through opacity-60"}
            >
              {t(item.labelKey)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
