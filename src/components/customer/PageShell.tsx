"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../LanguageProvider";
import CustomerHeader from "./CustomerHeader";
export default function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useLanguage();
  return <main className="customer-home"><CustomerHeader /><div className="customer-content page-content"><Link className="back-link" href="/home"><ArrowLeft size={17} />{t.dashboard.home}</Link><h1>{title}</h1>{children}</div></main>;
}
