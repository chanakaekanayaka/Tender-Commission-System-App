"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { PermissionsFieldset } from "@/components/features/users/PermissionsFieldset";
import { UserAccessPreview } from "@/components/features/users/UserAccessPreview";
import { useTranslation } from "@/context/LanguageContext";
import { ADMIN_PERMISSIONS, DEFAULT_PERMISSIONS, type User, type UserPermissions, type UserRole } from "@/shared/types/user.types";

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  monthlyTarget: number;
  role: UserRole;
  permissions: UserPermissions;
}

interface UserFormProps {
  initialUser?: User;
  onSubmit: (values: UserFormValues) => void;
  onCancel?: () => void;
}

const emptyValues: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  monthlyTarget: 0,
  role: "Staff",
  permissions: { ...DEFAULT_PERMISSIONS },
};

/** Shared create/edit form — used directly on the Create page and inside a Modal for editing a row from UsersTable. */
export function UserForm({ initialUser, onSubmit, onCancel }: UserFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<UserFormValues>(
    initialUser
      ? {
          firstName: initialUser.firstName,
          lastName: initialUser.lastName,
          email: initialUser.email,
          address: initialUser.address,
          monthlyTarget: initialUser.monthlyTarget,
          role: initialUser.role,
          permissions: { ...initialUser.permissions },
        }
      : emptyValues,
  );

  const isAdmin = values.role === "Admin";

  const update = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleRoleChange = (role: UserRole) =>
    setValues((prev) => ({
      ...prev,
      role,
      // Admin is always full-access; switching back to Staff restores the last-configured restrictions.
      permissions: role === "Admin" ? { ...ADMIN_PERMISSIONS } : prev.permissions,
    }));

  const canSubmit = values.firstName.trim() !== "" && values.lastName.trim() !== "" && values.email.trim() !== "";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: POST /api/users (create) or PATCH /api/users/:id (edit) once that route exists — UI-only mock phase (AGENTS.md).
    console.log(initialUser ? "Update user" : "Create user", values);
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title={t("userForm.detailsHeading")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={t("userForm.firstName")}
            value={values.firstName}
            onChange={(v) => update("firstName", v)}
          />
          <FormField
            label={t("userForm.lastName")}
            value={values.lastName}
            onChange={(v) => update("lastName", v)}
          />
          <FormField label={t("userForm.email")} value={values.email} onChange={(v) => update("email", v)} />
          <SelectField
            label={t("common.role")}
            value={values.role}
            onChange={(v) => handleRoleChange(v as UserRole)}
            options={[
              { value: "Staff", label: "Staff" },
              { value: "Admin", label: "Admin" },
            ]}
          />
          <div className="sm:col-span-2">
            <FormField label={t("userForm.address")} value={values.address} onChange={(v) => update("address", v)} />
          </div>
          <FormField
            label={t("userForm.monthlyTarget")}
            value={values.monthlyTarget}
            onChange={(v) => update("monthlyTarget", Number(v) || 0)}
            type="number"
            suffix="LKR"
          />
        </div>
      </Card>

      <Card title={t("userForm.permissionsHeading")}>
        {isAdmin ? (
          <p className="text-sm text-muted">{t("userForm.permissionsAdminHint")}</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted">{t("userForm.permissionsHint")}</p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
              <PermissionsFieldset
                permissions={values.permissions}
                onChange={(permissions) => update("permissions", permissions)}
              />
              <UserAccessPreview permissions={values.permissions} />
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
          >
            {t("common.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {initialUser ? t("userForm.updateUser") : t("userForm.createUser")}
        </button>
      </div>
    </form>
  );
}
