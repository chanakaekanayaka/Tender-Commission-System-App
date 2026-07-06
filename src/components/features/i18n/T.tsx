"use client";

import { useTranslation } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/locales";

interface TProps {
  k: TranslationKey;
  values?: Record<string, string | number>;
}

/**
 * Client leaf — `useTranslation` is a hook, so whatever calls it must run on
 * the client. This lets a Server Component page render translated text
 * without the whole page becoming a Client Component.
 */
export function T({ k, values }: TProps) {
  const { t } = useTranslation();
  return <>{t(k, values)}</>;
}
