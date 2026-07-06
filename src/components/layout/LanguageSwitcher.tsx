"use client";

import { Globe } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import type { Language } from "@/lib/i18n/locales";

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  si: "සිංහල",
};

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <label className="flex items-center gap-1.5 rounded-none border border-white/10 px-2 py-1.5 text-xs text-sidebar-ink/90">
      <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label={t("language.label")}
        className="w-full rounded-none border-none bg-transparent text-xs text-sidebar-ink outline-none [&>option]:bg-sidebar [&>option]:text-sidebar-ink"
      >
        {(Object.keys(LANGUAGE_LABELS) as Language[]).map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
