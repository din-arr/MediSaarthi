"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries } from "../i18n";
import type { Dictionary, LanguageCode } from "../i18n/types";

type LanguageContextValue = { lang: LanguageCode; setLang: (lang: LanguageCode) => void; t: Dictionary };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export default function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    try { const saved = window.localStorage.getItem("medisaarthi-language"); return saved && saved in dictionaries ? saved as LanguageCode : "en"; } catch { return "en"; }
  });
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (nextLang: LanguageCode) => {
    setLangState(nextLang);
    try { window.localStorage.setItem("medisaarthi-language", nextLang); } catch { /* localStorage may be unavailable */ }
  };
  const value = useMemo(() => ({ lang, setLang, t: dictionaries[lang] }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
