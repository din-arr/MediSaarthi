"use client";
import { ChevronDown, LogOut, MapPin, PackageCheck, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeToggle from "../ThemeToggle";
import { useLanguage } from "../LanguageProvider";
import NotificationBell from "./NotificationBell";
import CartButton from "./CartButton";

export default function CustomerHeader({ name = "M" }: { name?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };
  return <header className="customer-topbar"><div className="app-shell"><Link className="logo" href="/"><span className="logo-mark"><PackageCheck size={18} /></span><span>Medi<span className="logo-accent">Saarthi</span></span></Link><div className="customer-actions"><CartButton /><NotificationBell /><LanguageSwitcher /><ThemeToggle /><div className="avatar-menu"><button className="avatar-button" type="button" aria-label={t.dashboard.profile} onClick={() => setOpen((value) => !value)}><span>{name.slice(0, 1)}</span><ChevronDown size={16} /></button>{open && <div className="avatar-dropdown"><Link href="/profile"><UserRound size={16} />{t.dashboard.profile}</Link><Link href="/family"><Users size={16} />{t.dashboard.familyMembers}</Link><Link href="/addresses"><MapPin size={16} />{t.dashboard.addresses}</Link><button type="button" onClick={logout}><LogOut size={16} />{t.dashboard.logout}</button></div>}</div></div></div></header>;
}
