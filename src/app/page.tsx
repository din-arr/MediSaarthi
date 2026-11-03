"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, BellRing, Check, ChevronRight, Clock3, HeartPulse, Menu, Moon, PackageCheck, ShieldCheck, ShoppingBag, Sun, UserRound, X } from "lucide-react";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import AuthDialog from "../components/auth/AuthDialog";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../components/LanguageProvider";
import { useTheme } from "next-themes";

export default function Home() {
  return <Suspense fallback={<div className="product-shell" /> }><HomeContent /></Suspense>;
}

function HomeContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (searchParams.get("auth") !== "login") return;
    const timer = window.setTimeout(() => setAuthOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);
  const openAuth = () => { setMenuOpen(false); setAuthOpen(true); };
  const fade = { initial: { opacity: 0, y: reduced ? 0 : 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .2 }, transition: { duration: reduced ? 0 : .45 } };
  return <div id="top" className="product-shell">
    <header className="product-header"><Logo /><nav className={menuOpen ? "product-nav open" : "product-nav"}><a href="#how-it-works" onClick={() => setMenuOpen(false)}>{t.landing.navHow}</a><a href="#safety" onClick={() => setMenuOpen(false)}>{t.landing.navSafety}</a><a href="#caregivers" onClick={() => setMenuOpen(false)}>{t.landing.navCaregivers}</a></nav><div className="product-actions"><LanguageSwitcher /><ThemeToggle /><button className="ghost-button header-desktop" onClick={openAuth}>{t.landing.headerLogin}</button><button className="primary-button header-desktop" onClick={openAuth}>{t.landing.getStarted}</button><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X /> : <Menu />}</button></div></header>
    <main>
      <section className="product-hero section-wrap"><div className="hero-copy"><p className="eyebrow">{t.landing.heroEyebrow}</p><h1>{t.landing.heroTitle.replace(t.landing.heroAccent, "")}<span>{t.landing.heroAccent}</span></h1><p className="hero-description">{t.landing.heroDescription}</p><div className="hero-actions"><button className="primary-button" onClick={openAuth}>{t.landing.heroReorder}<ArrowRight size={17} /></button><button className="ghost-button" onClick={openAuth}>{t.landing.heroLogin}</button></div><div className="hero-trust">{t.landing.trustItems.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div></div><PhoneMockup t={t} reduced={reduced} /></section>
      <motion.section id="how-it-works" className="section-wrap content-section" {...fade}><SectionIntro eyebrow="01" title={t.landing.howTitle} description={t.landing.howDescription} /><div className="steps-grid">{t.landing.howSteps.map((step, index) => <motion.article className="step-card" key={step.title} initial={{ opacity: 0, y: reduced ? 0 : 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduced ? 0 : index * .08 }}><span className="step-number">0{index + 1}</span><StepIcon index={index} /><h3>{step.title}</h3><p>{step.description}</p></motion.article>)}</div></motion.section>
      <motion.section id="safety" className="safety-band" {...fade}><div className="section-wrap"><SectionIntro eyebrow="02" title={t.landing.safetyTitle} description="" /><div className="safety-grid">{t.landing.safetyItems.map((item) => <div className="safety-item" key={item}><ShieldCheck size={21} /><span>{item}</span></div>)}</div></div></motion.section>
      <motion.section id="caregivers" className="section-wrap caregiver-section" {...fade}><div><p className="eyebrow">03</p><h2>{t.landing.caregiverTitle}</h2><p>{t.landing.caregiverDescription}</p><button className="text-button" onClick={openAuth}>{t.landing.getStarted}<ChevronRight size={17} /></button></div><FamilyMockup t={t} /></motion.section>
      <motion.section className="final-cta section-wrap" {...fade}><h2>{t.landing.ctaTitle}</h2><button className="primary-button" onClick={openAuth}>{t.landing.ctaButton}<ArrowRight size={17} /></button></motion.section>
    </main>
    <footer className="product-footer"><span className="logo">Medi<span className="logo-accent">Saarthi</span></span><span>{t.landing.disclaimer}</span></footer>
    <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
  </div>;
}

function Logo() { return <a href="#top" className="logo" aria-label="MediSaarthi home"><span className="logo-mark"><HeartPulse size={20} /></span><span>Medi<span className="logo-accent">Saarthi</span></span></a>; }
function ThemeToggle() { const { resolvedTheme, setTheme } = useTheme(); const mounted = useSyncExternalStore(() => () => {}, () => true, () => false); return <button className="icon-button" aria-label="Toggle colour theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{mounted ? (resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : <span className="icon-placeholder" />}</button>; }
function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="section-intro"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{description && <p>{description}</p>}</div>; }
function StepIcon({ index }: { index: number }) { const icons = [<ShoppingBag key="bag" />, <ShieldCheck key="shield" />, <PackageCheck key="package" />, <BellRing key="bell" />]; return <span className="step-icon">{icons[index]}</span>; }
function PhoneMockup({ t, reduced }: { t: ReturnType<typeof useLanguage>["t"]; reduced: boolean | null }) { return <motion.div className="phone-stage" initial={{ opacity: 0, y: reduced ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .65 }}><div className="phone-glow" /><div className="phone-device"><div className="phone-notch" /><p className="phone-greeting">{t.landing.phoneGreeting}</p><div className="family-chip">{t.landing.phoneFamily}<ChevronRight size={14} /></div><div className="medicine-card"><div className="medicine-card-top"><span><Clock3 size={17} /></span><small>{t.landing.phoneRunsOut}</small></div><h3>{t.landing.phoneMedicine}</h3><button>{t.landing.phoneReorder}<ArrowRight size={15} /></button></div><div className="phone-status"><PackageCheck size={19} /><span>{t.landing.phonePacked}</span></div></div></motion.div>; }
function FamilyMockup({ t }: { t: ReturnType<typeof useLanguage>["t"] }) { const [selected, setSelected] = useState(0); return <div className="family-mockup"><div className="family-tabs">{t.landing.caregiverFamily.map((member, index) => <button className={selected === index ? "selected" : ""} onClick={() => setSelected(index)} key={member}><UserRound size={16} />{member}</button>)}</div><div className="family-detail"><div className="family-avatar"><HeartPulse /></div><div><strong>{t.landing.caregiverFamily[selected]}</strong><p><BellRing size={14} /> {t.landing.caregiverRefills}</p></div><ChevronRight /></div></div>; }
