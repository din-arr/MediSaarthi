"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../LanguageProvider";
import CustomerHeader from "./CustomerHeader";
export default function PageShell({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  const { t } = useLanguage();
  return <main className="customer-home"><CustomerHeader /><div className="customer-content page-content"><Link className="back-link" href="/home"><ArrowLeft size={17} />{t.dashboard.home}</Link><div className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>{children}</div></main>;
}
