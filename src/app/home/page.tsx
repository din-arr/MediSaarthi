"use client";

import { motion, useReducedMotion } from "motion/react";
import { Bell, ChevronRight, FileUp, Search, Users, Upload } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import CustomerHeader from "../../components/customer/CustomerHeader";
import OrderTimeline, { OrderStatusPill } from "../../components/customer/OrderTimeline";

type FamilyStat = { id: string; name: string; relation: string | null; refillCount: number; ordersThisMonth: number; nextRefill: { product: string; days: number } | null };
type HomeData = { name: string; greeting: "morning" | "afternoon" | "evening"; familyMembers: Array<{ id: string; name: string; relation: string }>; familyStats: FamilyStat[]; selectedPerson: FamilyStat; refills: Array<{ productId: string; product: string; nextRunOutDate: string; days: number; lastQty: number }>; orders: Array<{ id: string; number: string; status: string; createdAt: string; store: string; items: string[] }> };

export default function HomePage() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const [data, setData] = useState<HomeData | null>(null);
  const [selectedFamily, setSelectedFamily] = useState("me");

  useEffect(() => { fetch(`/api/home${selectedFamily === "me" ? "" : `?familyMemberId=${selectedFamily}`}`).then((response) => response.ok ? response.json() : null).then((value: HomeData | null) => setData(value)); }, [selectedFamily]);
  const greeting = data?.greeting === "morning" ? t.dashboard.greetingMorning : data?.greeting === "afternoon" ? t.dashboard.greetingAfternoon : t.dashboard.greetingEvening;
  const latest = data?.orders[0];
  const motionProps = reduced ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: .3 } };

  return <main className="customer-home"><CustomerHeader name={data?.name} />
    <div className="customer-content">{!data ? <HomeSkeleton /> : <><motion.section className="customer-greeting" {...motionProps}><p className="eyebrow">{t.auth.brand}</p><h1>{greeting}, {data.name}</h1><div className="family-chips"><button className={selectedFamily === "me" ? "selected" : ""} onClick={() => setSelectedFamily((current) => current === "me" ? "" : "me")} type="button">{t.dashboard.familyMe}</button>{data.familyMembers.map((member) => <button className={selectedFamily === member.id ? "selected" : ""} onClick={() => setSelectedFamily((current) => current === member.id ? "" : member.id)} type="button" key={member.id}>{member.name} · {member.relation}</button>)}<Link className="family-chip-link" href="/family"><span>+</span> {t.dashboard.addFamily}</Link></div></motion.section>
      <div className="home-dashboard-grid"><div className="home-main-column"><motion.section className="customer-hero-card hero-gradient" {...motionProps}><div className="hero-card-icon"><Upload size={30} /></div><div className="hero-card-copy"><h2>{latest ? t.dashboard.reorderMonthly : t.dashboard.uploadFirst}</h2>{latest && <p>{t.dashboard.reorderSubtitle.replace("{count}", String(latest.items.length)).replace("{date}", new Date(latest.createdAt).toLocaleDateString())}</p>}</div><div className="hero-card-actions"><Link className="reorder-button" href={latest ? "/reorder" : "/upload"}><span>{latest ? t.dashboard.reorderMonthly : t.dashboard.uploadFirst}</span><ChevronRight size={22} /></Link><Link className="secondary-button" href="/search"><Search size={18} />{t.dashboard.searchMedicines}</Link></div></motion.section>
      <motion.section className="customer-section" {...motionProps}><div className="section-heading"><h2>{t.dashboard.runningLow}</h2><Bell size={20} /></div>{data.refills.length ? <div className="reminder-grid">{data.refills.map((refill) => { const days = refill.days; return <article className={`reminder-card ${days <= 2 ? "urgent" : days <= 5 ? "soon" : ""}`} key={refill.product}><div><strong>{refill.product}</strong><p>{t.dashboard.runsOutIn} {days} {t.dashboard.days}</p></div><Link href={`/reorder?product=${refill.productId}`} className="text-button">{t.dashboard.reorder}</Link></article>; })}</div> : <p className="empty-copy">{t.dashboard.noReminders}</p>}</motion.section>
      <motion.section className="customer-section" {...motionProps}><div className="section-heading"><h2>{t.dashboard.yourOrders}</h2><Link className="text-action" href="/orders">{t.dashboard.viewAll}</Link></div>{latest ? <Link className="order-card order-card-link" href={`/orders/${latest.id}`}><div className="order-summary"><strong>{latest.number} · <OrderStatusPill status={latest.status} /></strong><span>{latest.status === "PACKED" ? `${t.dashboard.packedAt} ${latest.store}` : `${t.dashboard.assignedTo} ${latest.store}`}</span></div><OrderTimeline status={latest.status} /></Link> : <p className="empty-copy">{t.dashboard.noOrders}</p>}</motion.section>
      </div><aside className="home-side-column"><motion.section className="customer-section quick-section" {...motionProps}><h2>{t.dashboard.quickActions}</h2><div className="quick-actions"><QuickAction href="/upload" icon={<FileUp />} title={t.dashboard.uploadPrescription} description="JPG, PNG or PDF · up to 5 MB" tone="teal" /><QuickAction href="/search" icon={<Search />} title={t.dashboard.searchMedicines} description={t.dashboard.searchPlaceholder} tone="sky" /><QuickAction href="/family" icon={<Users />} title={t.dashboard.familyMembers} description={t.dashboard.addFamily} tone="violet" /></div></motion.section><motion.section className="customer-section family-summary-card" {...motionProps}><div className="section-heading"><h2>{t.dashboard.familyMembers}</h2><Link className="text-action" href="/family">{t.dashboard.addFamily}</Link></div><div className="family-person-list">{data.familyStats.map((person, index) => <article className={`family-person-card family-tone-${index % 4}`} key={person.id}><button className="family-person-select" type="button" onClick={() => setSelectedFamily(person.id)}><span className="family-avatar">{person.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="family-person-copy"><strong>{person.id === "me" ? person.name : `${person.name} · ${person.relation}`}</strong><small>{person.nextRefill ? t.dashboard.nextRefill.replace("{product}", person.nextRefill.product).replace("{days}", String(person.nextRefill.days)) : t.dashboard.noRefillsDue}</small><small>{t.dashboard.refillsThisMonth.replace("{count}", String(person.refillCount + person.ordersThisMonth))}</small></span></button><Link className="family-person-detail" href={`/family#${person.id}`} aria-label={`View ${person.name}`}><ChevronRight size={19} /></Link></article>)}</div></motion.section></aside></div></>}</div>
  </main>;
}

function QuickAction({ href, icon, title, description, tone }: { href: string; icon: ReactNode; title: string; description: string; tone: string }) {
  return <Link className="quick-action-card" href={href}><span className={`icon-tile ${tone}`}>{icon}</span><span className="quick-action-copy"><strong>{title}</strong><span>{description}</span></span><ChevronRight className="quick-action-arrow" size={18} /></Link>;
}

function HomeSkeleton() {
  return <div className="home-skeleton"><span /><span /><span /><span /></div>;
}
