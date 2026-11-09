"use client";
import { useCallback } from "react";
import { useLanguage } from "../LanguageProvider";
import { translateStaff } from "../../i18n/staff";

/** `s("English text", { vars })` for the staff screens, in the language picked in the header. */
export function useStaffText() {
  const { lang } = useLanguage();
  return useCallback((text: string, vars?: Record<string, string | number>) => translateStaff(lang, text, vars), [lang]);
}
