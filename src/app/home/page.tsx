"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../components/LanguageProvider";

export default function HomePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  useEffect(() => { fetch("/api/auth/session").then((response) => response.ok ? response.json() : null).then((session: { name: string } | null) => { if (session) setName(session.name); }); }, []);
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };
  return <main className="dashboard-shell"><section className="dashboard-card"><p className="eyebrow">{t.auth.brand}</p><h1>{name ? t.dashboard.welcomeName.replace("{name}", name) : t.dashboard.welcome}</h1><p>{t.dashboard.customerHome}</p><button className="primary-button" onClick={logout}>{t.dashboard.logout}</button></section></main>;
}
