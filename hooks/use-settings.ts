"use client";

import { useSettingsContext } from "@/contexts/settings-context";
import { getTranslations, type TranslationKey, type AppCurrency } from "@/lib/i18n";

export function useSettings() {
  const { settings, setLanguage } = useSettingsContext();
  const dict = getTranslations(settings.language);

  function t(key: TranslationKey): string {
    return dict[key] ?? key;
  }

  function formatCurrency(value: string | number, currency: AppCurrency): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat(settings.language, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(num);
  }

  return { settings, setLanguage, t, formatCurrency };
}
