"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, ChevronDown, FileUp, LogOut, Search, UserRound, Users, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ThemeToggle from "../../components/ThemeToggle";
import { useLanguage } from "../../components/LanguageProvider";

type HomeData = { name: string; greeting: "morning" | "afternoon" | "evening"; familyMembers: Array<{ id: string; name: string; relation: string }>; refills: Array<{ product: string; nextRunOutDate: string; days: number; lastQty: number }>; orders: Array<{ number: string; status: string; createdAt: string; store: string; items: string[] }> };

export default function HomePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [data, setData] = useState<HomeData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState("me");

  useEffect(() => { fetch("/api/home").then((response) => response.ok ? response.json() : null).then((value: HomeData | null) => setData(value)); }, []);
  const greeting = data?.greeting === "morning" ? t.dashboard.greetingMorning : data?.greeting === "afternoon" ? t.dashboard.greetingAfternoon : t.dashboard.greetingEvening;
  const latest = data?.orders[0];
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };
  const motionProps = reduced ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: .3 } };

  return <main className="customer-home"><header className="customer-topbar"><Link className="logo" href="/"><span className="logo-mark"><PackageCheck size={18} /></span><span>Medi<span className="logo-accent">Saarthi</span></span></Link><div className="customer-actions"><LanguageSwitcher /><ThemeToggle /><div className="avatar-menu"><button className="avatar-button" type="button" aria-label={t.dashboard.profile} onClick={() => setMenuOpen((open) => !open)}><span>{data?.name?.slice(0, 1) ?? "M"}</span><ChevronDown size={16} /></button><AnimatePresence>{menuOpen && <motion.div className="avatar-dropdown" {...(reduced ? {} : { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } })}><button type="button"><UserRound size={16} />{t.dashboard.profile}</button><button type="button"><Users size={16} />{t.dashboard.familyMembers}</button><button type="button" onClick={logout}><LogOut size={16} />{t.dashboard.logout}</button></motion.div>}</AnimatePresence></div></div></header>
    <div className="customer-content">{!data ? <HomeSkeleton /> : <><motion.section className="customer-greeting" {...motionProps}><p className="eyebrow">{t.auth.brand}</p><h1>{greeting}, {data.name}</h1><div className="family-chips"><button className={selectedFamily === "me" ? "selected" : ""} onClick={() => setSelectedFamily("me")} type="button">{t.dashboard.familyMe}</button>{data.familyMembers.map((member) => <button className={selectedFamily === member.id ? "selected" : ""} onClick={() => setSelectedFamily(member.id)} type="button" key={member.id}>{member.relation}</button>)}<button type="button"><span>+</span> {t.dashboard.addFamily}</button></div></motion.section>
      <motion.section className="customer-hero-card" {...motionProps}><button className="reorder-button" type="button"><span>{latest ? t.dashboard.reorderMonthly : t.dashboard.uploadFirst}</span><ChevronDown size={22} /></button>{latest && <p>{t.dashboard.reorderSubtitle.replace("{count}", String(latest.items.length)).replace("{date}", new Date(latest.createdAt).toLocaleDateString())}</p>}</motion.section>
      <motion.section className="customer-section" {...motionProps}><div className="section-heading"><h2>{t.dashboard.runningLow}</h2><Bell size={20} /></div>{data.refills.length ? <div className="reminder-grid">{data.refills.map((refill) => { const days = refill.days; return <article className={`reminder-card ${days <= 2 ? "urgent" : days <= 5 ? "soon" : ""}`} key={refill.product}><div><strong>{refill.product}</strong><p>{t.dashboard.runsOutIn} {days} {t.dashboard.days}</p></div><button type="button">{t.dashboard.reorder}</button></article>; })}</div> : <p className="empty-copy">{t.dashboard.noReminders}</p>}</motion.section>
      <motion.section className="customer-section" {...motionProps}><div className="section-heading"><h2>{t.dashboard.yourOrders}</h2><button className="text-action" type="button">{t.dashboard.viewAll}</button></div>{latest ? <article className="order-card"><div className="order-summary"><strong>{latest.number} · {latest.status === "PACKED" ? t.dashboard.packed : latest.status}</strong><span>{latest.store} {t.dashboard.packedAt.toLowerCase()}</span></div><div className="status-timeline">{[t.dashboard.awaitingPharmacist, t.dashboard.approved, t.dashboard.packed, t.dashboard.outForDelivery, t.dashboard.delivered].map((status, index) => <div className={index <= 2 ? "complete" : ""} key={status}><span />{status}</div>)}</div></article> : <p className="empty-copy">{t.dashboard.noOrders}</p>}</motion.section>
      <motion.section className="customer-section quick-section" {...motionProps}><h2>{t.dashboard.quickActions}</h2><div className="quick-actions"><button type="button"><FileUp size={21} />{t.dashboard.uploadPrescription}</button><button type="button"><Search size={21} />{t.dashboard.searchMedicines}</button><button type="button"><Users size={21} />{t.dashboard.familyMembers}</button></div></motion.section></>}</div>
  </main>;
}

function HomeSkeleton() {
  return <div className="home-skeleton"><span /><span /><span /><span /></div>;
}
