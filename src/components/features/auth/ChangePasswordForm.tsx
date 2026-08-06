"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

/** Self-service password change — PATCHes /api/auth/change-password, which scopes the update to
 *  the caller's own account via the JWT (never a target id), so this form never needs to know
 *  which user it's changing. Clears every field on success so the old password doesn't linger in
 *  the DOM. */
export function ChangePasswordForm() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!currentPassword) errors.currentPassword = t("profile.currentPasswordRequired");
    if (newPassword.length < 8) errors.newPassword = t("profile.newPasswordTooShort");
    if (confirmNewPassword !== newPassword) errors.confirmNewPassword = t("profile.passwordsDontMatch");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setFieldErrors({});
      setToast({ message: t("profile.passwordChanged"), variant: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to change password.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title={t("profile.changePasswordHeading")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label={t("profile.currentPassword")}
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={fieldErrors.currentPassword}
        />
        <FormField
          label={t("profile.newPassword")}
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          error={fieldErrors.newPassword}
        />
        <FormField
          label={t("profile.confirmNewPassword")}
          type="password"
          value={confirmNewPassword}
          onChange={setConfirmNewPassword}
          error={fieldErrors.confirmNewPassword}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("profile.changingPassword") : t("profile.changePassword")}
        </button>
      </form>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </Card>
  );
}
