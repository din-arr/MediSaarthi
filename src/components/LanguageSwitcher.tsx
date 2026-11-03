"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { languageOptions } from "../i18n";
import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = languageOptions.find((option) => option.code === lang) ?? languageOptions[0];
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);
  return <div ref={ref} className="relative">
    <button type="button" aria-label="Choose language" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="language-button">
      <Globe size={17} aria-hidden="true"/><span className="text-[11px] font-bold">{current.short}</span><ChevronDown size={13} aria-hidden="true"/>
    </button>
    {open && <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#12302b]">
      {languageOptions.map((option) => <button key={option.code} type="button" role="menuitem" onClick={() => { setLang(option.code); setOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-emerald-50 dark:hover:bg-white/10">
        <span><strong className="font-semibold">{option.native}</strong><small className="ml-2 text-xs text-slate-500 dark:text-slate-400">({option.english})</small></span>{option.code === lang && <Check size={16} className="text-emerald-600 dark:text-emerald-300"/>}
      </button>)}
    </div>}
  </div>;
}
