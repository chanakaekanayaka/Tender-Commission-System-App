"use client";

import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { useTheme } from "@/context/ThemeProvider";
import { useTranslation } from "@/context/LanguageContext";
import type { SystemConfig as SystemConfigValues } from "@/shared/types/system-config.types";

interface SystemConfigProps {
  initialValues: SystemConfigValues;
}

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * VAT Registered / VAT Percentage / Payment Due Period / Theme Color / Logo are all real, backed
 * by PATCH /api/system-config (and POST /api/system-config/logo for the logo file itself) —
 * Payment Due Period drives Job Order Pending's Due Date, Theme Color and Logo both drive both
 * portals' sidebars (see ThemeProvider and AdminSidebar/StaffSidebar). Company Name is still a
 * mock-saved field — nothing else in the app reads it yet.
 */
export function SystemConfig({ initialValues }: SystemConfigProps) {
  const { t } = useTranslation();
  const { setSidebarColor } = useTheme();
  const [values, setValues] = useState<SystemConfigValues>(initialValues);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!logoPreviewUrl) return;
    return () => URL.revokeObjectURL(logoPreviewUrl);
  }, [logoPreviewUrl]);

  const update = <K extends keyof SystemConfigValues>(key: K, value: SystemConfigValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setToast({ message: t("systemConfig.invalidLogoType"), variant: "error" });
      return;
    }

    // Instant local preview while the real upload is in flight — swapped for the persisted URL
    // once it comes back, same pattern as every other real upload in the app.
    setLogoPreviewUrl(URL.createObjectURL(file));
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/system-config/logo", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to upload logo.");
      }
      update("logoFileName", result.data.fileName);
      update("logoUrl", result.data.logoUrl);
      setToast({ message: t("systemConfig.logoUploaded"), variant: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to upload logo.", variant: "error" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setIsRemovingLogo(true);
    try {
      const res = await fetch("/api/system-config/logo", { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to remove logo.");
      }
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
      update("logoFileName", undefined);
      update("logoUrl", undefined);
      setToast({ message: t("systemConfig.logoRemoved"), variant: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to remove logo.", variant: "error" });
    } finally {
      setIsRemovingLogo(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/system-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVatRegistered: values.isVatRegistered,
          vatPercentage: values.vatPercentage,
          paymentDueDays: values.paymentDueDays,
          themeColor: values.themeColor,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to save system config.");
      }

      setSidebarColor(values.themeColor);
      setToast({ message: t("systemConfig.saved"), variant: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to save system config.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayedLogoUrl = logoPreviewUrl ?? values.logoUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title={t("systemConfig.detailsHeading")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={t("systemConfig.companyName")}
            value={values.companyName}
            onChange={(v) => update("companyName", v)}
          />
          <FormField
            label={t("systemConfig.vatPercentage")}
            value={values.vatPercentage}
            onChange={(v) => update("vatPercentage", Math.min(100, Math.max(0, Number(v) || 0)))}
            type="number"
            min={0}
            max={100}
            step={1}
            suffix="%"
            disabled={!values.isVatRegistered}
          />
          <FormField
            label={t("systemConfig.paymentDueDays")}
            value={values.paymentDueDays}
            onChange={(v) => update("paymentDueDays", Math.max(0, Number(v) || 0))}
            type="number"
            min={0}
            step={1}
            suffix={t("systemConfig.paymentDueDaysSuffix")}
          />
        </div>
        <div className="mt-4">
          <Toggle
            label={t("systemConfig.vatRegistered")}
            checked={values.isVatRegistered}
            onChange={(checked) => update("isVatRegistered", checked)}
          />
        </div>
        <p className="mt-3 text-xs text-muted">{t("systemConfig.paymentDueDaysHint")}</p>
      </Card>

      <Card title={t("systemConfig.logoHeading")}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-none border border-border bg-surface">
            {displayedLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime object URL / signed S3 URL, not a static asset
              <img src={displayedLogoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted" aria-hidden />
            )}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => handleLogoChange(e.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo || isRemovingLogo}
                className="inline-flex items-center gap-1.5 rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploadingLogo && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                {isUploadingLogo ? t("systemConfig.uploadingLogo") : t("systemConfig.chooseLogo")}
              </button>
              {values.logoFileName && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isUploadingLogo || isRemovingLogo}
                  className="inline-flex items-center gap-1.5 rounded-none border border-red-600 bg-card px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRemovingLogo && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {isRemovingLogo ? t("systemConfig.removingLogo") : t("systemConfig.removeLogo")}
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">{values.logoFileName ?? t("systemConfig.noLogoChosen")}</p>
          </div>
        </div>
      </Card>

      <Card title={t("systemConfig.themeHeading")}>
        <p className="mb-3 text-xs text-muted">{t("systemConfig.themeHint")}</p>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm">
            <span className="text-muted">{t("systemConfig.themeColor")}</span>
            <input
              type="color"
              value={values.themeColor}
              onChange={(e) => update("themeColor", e.target.value)}
              className="h-9 w-16 cursor-pointer rounded-none border border-border bg-surface p-0"
            />
          </label>
          <span className="text-sm text-muted">{values.themeColor}</span>
        </div>

        <div
          className="mt-4 rounded-none border border-border p-3"
          style={{ backgroundColor: values.themeColor }}
        >
          <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
            {t("systemConfig.previewLabel")}
          </p>
          <p className="text-sm font-bold text-white">TENDER-CMS</p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("systemConfig.save")}
        </button>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </form>
  );
}
