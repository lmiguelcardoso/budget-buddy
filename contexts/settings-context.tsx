"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency, Language } from "@/lib/i18n";

interface Settings {
  currency: Currency;
  language: Language;
}

const DEFAULT_SETTINGS: Settings = {
  currency: "USD",
  language: "en",
};

const STORAGE_KEY = "budget-buddy-settings";

interface SettingsContextValue {
  settings: Settings;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch {
      // ignore malformed storage
    }
  }, []);

  function update(patch: Partial<Settings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setCurrency: (currency) => update({ currency }),
        setLanguage: (language) => update({ language }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used inside SettingsProvider");
  return ctx;
}
