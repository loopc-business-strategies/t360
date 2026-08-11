"use client";

import * as React from "react";
import messages from "../../messages/ui.json";

export type Locale = "en" | "ta";
export type Messages = typeof messages.en;

const LocaleContext = React.createContext<{
  locale: Locale;
  t: Messages;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
} | null>(null);

const STORAGE_KEY = "t360_locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "ta") setLocaleState(stored);
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === "ta" ? "ta" : "en";
  }, []);

  const toggleLocale = React.useCallback(() => {
    setLocale(locale === "en" ? "ta" : "en");
  }, [locale, setLocale]);

  const value = React.useMemo(
    () => ({ locale, t: messages[locale], setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale requires LocaleProvider");
  return ctx;
}
