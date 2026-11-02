"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight, BadgeCheck, BellRing, ChevronDown,
  ClipboardCheck, FileCheck2, FileImage, HeartHandshake,
  HeartPulse, LockKeyhole, Menu, PackageCheck,
  Search, ShieldCheck, Sparkles, Truck,
  UploadCloud, Users, X,
} from "lucide-react";
import MedicineCatalogue from "./components/MedicineCatalogue";

const faqs = [
  { q: "Can I order prescription medicines directly?", a: "In the planned ordering flow, prescription-only medicines must be reviewed by a pharmacist before they can be packed or dispatched. This homepage is a demonstration and cannot place orders yet." },
  { q: "Does AI approve my prescription?", a: "No. AI will only propose a draft extraction. A qualified pharmacist must check the original prescription and approve or reject each item. Unreadable prescriptions require a clearer upload." },
  { q: "Will refill reminders be automatic?", a: "The planned service will estimate refill dates from verified quantities and dosage information. Any uncertainty will be flagged instead of silently assuming a dosage." },
  { q: "Is MediSaarthi a real pharmacy service?", a: "Not yet. MediSaarthi is an independent educational demonstration project. All sample catalogue data and prices are illustrative; no real prescriptions or patient details should be uploaded." },
];

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="MediSaarthi home">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#087e70] text-white shadow-[0_5px_15px_#087e7033]"><HeartPulse size={22} strokeWidth={2.4} /></span>
      <span className="text-[23px] font-extrabold tracking-[-.055em] text-[#163b36]">Medi<span className="text-[#0a987c]">Saarthi</span></span>
    </a>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [uploaded, setUploaded] = useState<{ name: string; size: string } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal-on-scroll");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -25px 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Choose a PDF, JPG, PNG or WebP file."); setUploaded(null); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Please choose a file under 5 MB."); setUploaded(null); return;
    }
    setUploadError("");
    setUploaded({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
  };

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-[#f8fbf9] text-[#193c36]">
      <div className="bg-[#0a6d60] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white sm:text-xs">
        Independent educational demo <span className="mx-2 opacity-40">|</span> Not accepting real orders or medical records
      </div>

      <header className="sticky top-0 z-50 border-b border-[#deebe6] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-9 text-[13px] font-semibold text-[#526e65] lg:flex" aria-label="Main navigation">
            <a className="nav-link" href="#medicines">Medicines</a>
            <a className="nav-link" href="#prescription">Upload prescription</a>
            <a className="nav-link" href="#how-it-works">How it works</a>
            <a className="nav-link" href="#faq">FAQs</a>
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <a href="#prescription" className="rounded-full border border-[#d7e8e1] px-5 py-3 text-xs font-bold text-[#145d51] transition hover:bg-[#f0f8f4]">Upload Rx</a>
            <a href="#medicines" className="inline-flex items-center gap-2 rounded-full bg-[#087e70] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_20px_#0b8f7530] transition hover:bg-[#06685e]">Explore medicines <ArrowRight size={15}/></a>
          </div>
          <button type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} className="rounded-xl border border-[#deebe6] p-2.5 lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23}/> : <Menu size={23}/>}</button>
        </div>
        {menuOpen && <nav aria-label="Mobile navigation" className="flex flex-col gap-1 border-t border-[#e5eee9] bg-white px-5 pb-5 pt-3 lg:hidden">{[["Medicines", "#medicines"],["Upload prescription", "#prescription"],["How it works", "#how-it-works"],["FAQs", "#faq"]].map(([name,href]) => <a key={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[#f0f8f4]" href={href}>{name}</a>)}</nav>}
      </header>

      <main>
        <section className="hero-mesh relative">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:pb-28 lg:pt-24">
            <div className="hero-copy relative z-10 max-w-[620px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe9dd] bg-white/90 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#0a806d] shadow-sm"><Sparkles size={15}/> Healthcare, with a human touch</div>
              <h1 className="mt-7 text-[clamp(3rem,6vw,5.5rem)] font-extrabold leading-[1.08] tracking-[-.07em] text-[#173b35]">Your medicines.<br/><span className="text-[#0d987d]">Our care.</span><br/>Made simple.</h1>
              <p className="mt-7 max-w-[520px] text-[16px] leading-[1.85] text-[#627c72] sm:text-lg">A simpler way to manage family prescriptions, reorder essentials and stay ready for your next refill — with a pharmacist always in the loop.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#medicines" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#087e70] px-7 text-sm font-bold text-white shadow-[0_15px_30px_#087e702b] transition hover:-translate-y-0.5 hover:bg-[#066c60]">Explore medicines <ArrowRight size={18}/></a>
                <a href="#prescription" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-[#ceded5] bg-white px-7 text-sm font-bold text-[#175c4f] transition hover:border-[#0d987d] hover:bg-[#f7fcf8]"><UploadCloud size={18}/> Upload prescription</a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-semibold text-[#557367]"><span className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#0d987d]"/> Pharmacist-first safety</span><span className="flex items-center gap-2"><Users size={17} className="text-[#0d987d]"/> Family-friendly</span><span className="flex items-center gap-2"><HeartHandshake size={17} className="text-[#0d987d]"/> Designed for India</span></div>
            </div>
            <div className="hero-visual relative mx-auto w-full max-w-[560px]">
              <div className="absolute -right-6 -top-6 h-64 w-64 rounded-full bg-[#b7e7d0] opacity-55 blur-3xl"/>
              <div className="relative overflow-hidden rounded-[42px] border-[8px] border-white bg-[#d4eee3] shadow-[0_25px_90px_#236b5330]">
                <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Healthcare professional supporting a patient" className="h-[380px] w-full object-cover sm:h-[530px]" onError={(e) => {e.currentTarget.style.display="none";}}/>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d5145e8] via-[#0d514580] to-transparent px-8 pb-8 pt-28 text-white"><span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold backdrop-blur"><BadgeCheck size={17}/> A safer way to reorder</span><p className="mt-3 max-w-xs text-2xl font-extrabold leading-tight">Good care starts with the right checks.</p></div>
              </div>
              <div className="floating-card absolute -left-4 top-8 flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_15px_45px_#1d68512b] sm:-left-12"><span className="rounded-xl bg-[#e4f7ed] p-2.5 text-[#0c8d72]"><ShieldCheck size={22}/></span><span><strong className="block text-xs">Prescription review</strong><small className="text-[10px] text-[#739086]">Pharmacist-led design</small></span></div>
              <div className="floating-card absolute -bottom-5 right-0 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_15px_45px_#1d68512b] sm:-right-6"><span className="rounded-xl bg-[#fff1d8] p-2.5 text-[#c88b24]"><BellRing size={22}/></span><span><strong className="block text-xs">Stay refill-ready</strong><small className="text-[10px] text-[#739086]">Timely reminders, less worry</small></span></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e2eee7] bg-white" aria-label="Platform principles"><div className="mx-auto grid max-w-[1240px] gap-5 px-5 py-7 sm:grid-cols-3 sm:px-8">{[[ShieldCheck,"Safety first","Human review of prescriptions"],[Truck,"Local pharmacy network","Designed around store availability"],[HeartHandshake,"Care for the family","Simple repeat-medicine routines"]].map(([Icon,title,desc]) => { const IconComponent = Icon as typeof ShieldCheck; return <div key={title as string} className="flex items-center gap-3 sm:justify-center"><span className="rounded-xl bg-[#eaf7f0] p-2.5 text-[#0a8973]"><IconComponent size={21}/></span><span><strong className="block text-xs font-extrabold">{title as string}</strong><small className="text-[11px] text-[#809389]">{desc as string}</small></span></div>;})}</div></section>

        <MedicineCatalogue />

        <section id="prescription" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-2">
          <div className="relative"><div className="overflow-hidden rounded-[36px] bg-[#e8f5ed] shadow-[0_18px_60px_#1e765118]"><img src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1000&q=85" alt="Medical care and prescription consultation" className="h-[340px] w-full object-cover sm:h-[470px]" onError={(e)=>{e.currentTarget.style.display="none";}}/></div><div className="absolute -bottom-6 right-4 flex items-center gap-3 rounded-2xl border border-[#e1efe6] bg-white p-4 shadow-xl sm:right-[-15px]"><span className="rounded-xl bg-[#e6f7ec] p-2 text-[#0a8a70]"><FileCheck2 size={24}/></span><span><strong className="block text-xs">Review before fulfilment</strong><small className="text-[11px] text-[#759083]">Humans stay in control</small></span></div></div>
          <div><p className="eyebrow">PRESCRIPTIONS MADE SIMPLER</p><h2 className="section-heading">Upload once.<br/><span className="text-[#0a947a]">Review with confidence.</span></h2><p className="section-description">Our planned AI-assisted workflow will draft the medicine details so a pharmacist can check the original prescription, correct mistakes and decide what can be fulfilled.</p><div className="mt-7 space-y-3">{[["1","Upload a clear prescription"],["2","AI prepares a draft, never an approval"],["3","A pharmacist verifies every prescription item"]].map(([n,t])=><div key={n} className="flex items-center gap-3 text-sm font-semibold text-[#46665a]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e4f5eb] text-[#07836c]">{n}</span>{t}</div>)}</div>
          <div className="mt-8 rounded-[24px] border-2 border-dashed border-[#b9dacb] bg-[#f7fcf8] p-5"><input ref={fileRef} aria-label="Choose a demo prescription file" onChange={onFile} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden"/><div className="flex items-start gap-4"><span className="rounded-2xl bg-white p-3 text-[#0a8c74] shadow-sm"><UploadCloud size={25}/></span><div className="flex-1"><h3 className="text-sm font-extrabold">Try the upload preview</h3><p className="mt-1 text-xs leading-6 text-[#759084]">PDF, JPG, PNG or WebP, up to 5 MB. The file stays in your browser; nothing is uploaded.</p></div></div><button type="button" onClick={()=>fileRef.current?.click()} className="mt-5 w-full rounded-xl bg-[#087e70] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#06685d]">Choose a sample file</button>{uploaded && <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white p-3 text-xs"><span className="flex min-w-0 items-center gap-2"><FileImage className="shrink-0 text-[#0a8c74]" size={19}/><span className="truncate font-semibold">{uploaded.name} ({uploaded.size})</span></span><button aria-label="Remove selected file" onClick={()=>{setUploaded(null);if(fileRef.current)fileRef.current.value="";}}><X size={18}/></button></div>}{uploadError && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{uploadError}</p>}</div><p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#819389]"><LockKeyhole size={16} className="shrink-0"/> Demo only: do not select a real patient&apos;s prescription or sensitive medical record.</p>
          </div>
        </div></section>

        <section id="how-it-works" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-24"><div className="mx-auto max-w-[1240px]"><div className="mx-auto max-w-[640px] text-center"><p className="eyebrow">SIMPLE BY DESIGN</p><h2 className="section-heading">From prescription <span className="text-[#0a947a]">to peace of mind.</span></h2><p className="section-description mx-auto">A clear, pharmacist-led flow for the everyday essentials your family needs.</p></div><div className="mt-14 grid gap-5 md:grid-cols-3">{[[Search,"01","Find your medicines","Browse a clear catalogue and prepare your repeat order."],[ClipboardCheck,"02","Get pharmacist verification","Prescription-only items require a human review before fulfilment."],[PackageCheck,"03","Track your order & refill","Follow order progress and stay informed about upcoming refills."]].map(([Icon,n,t,d])=>{const I=Icon as typeof Search;return <div key={n as string} className="reveal-on-scroll process-card relative rounded-[28px] border border-[#deeee4] bg-white p-8 shadow-[0_8px_30px_#0b69430a]"><span className="absolute right-8 top-7 text-5xl font-extrabold tracking-[-.08em] text-[#edf6ef]">{n as string}</span><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e3f5eb] text-[#09816f]"><I size={27}/></span><h3 className="mt-9 text-lg font-extrabold">{t as string}</h3><p className="mt-3 text-sm leading-7 text-[#758b80]">{d as string}</p></div>})}</div></div></section>

        <section className="bg-[#0a6e60] px-5 py-16 text-white sm:px-8 lg:py-20"><div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-10 md:flex-row md:items-center"><div className="max-w-[620px]"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#b8e6d2]">BUILT AROUND REAL CARE</p><h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">The pharmacist is part of the process. Not an afterthought.</h2><p className="mt-4 text-sm leading-7 text-[#cce9dd]">Every prescription-based order in our planned system follows a review-first workflow. Safety is a product requirement, not just a design badge.</p></div><a className="inline-flex shrink-0 items-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-[#096e60] transition hover:bg-[#e9f5ef]" href="#faq">Learn more <ArrowRight size={18}/></a></div></section>

        <section id="faq" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">GOOD TO KNOW</p><h2 className="section-heading">Questions?<br/><span className="text-[#0a947a]">We have answers.</span></h2><p className="section-description">A few important details about how MediSaarthi is designed to work.</p></div><div className="space-y-3">{faqs.map((faq,i)=><div key={faq.q} className="faq-card overflow-hidden rounded-2xl border border-[#deebe2] bg-[#fbfdfb]"><button type="button" aria-expanded={faqOpen===i} onClick={()=>setFaqOpen(faqOpen===i?null:i)} className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-bold sm:p-6"><span>{faq.q}</span><ChevronDown size={19} className={`shrink-0 text-[#087e70] transition-transform ${faqOpen===i?"rotate-180":""}`}/></button>{faqOpen===i&&<p className="px-5 pb-6 text-sm leading-7 text-[#6b8378] sm:px-6">{faq.a}</p>}</div>)}</div></div></section>
      </main>

      <footer className="bg-[#103a33] px-5 pb-8 pt-14 text-white sm:px-8"><div className="mx-auto max-w-[1240px]"><div className="grid gap-10 border-b border-white/15 pb-12 md:grid-cols-[1.5fr_1fr_1fr]"><div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#14a88a]"><HeartPulse size={21}/></span><strong className="text-xl tracking-tight">MediSaarthi</strong></div><p className="mt-5 max-w-sm text-sm leading-7 text-[#b7d1c6]">Making pharmacy reordering feel clearer, calmer and more human — one carefully designed step at a time.</p></div><div><h3 className="text-sm font-extrabold">Explore</h3><div className="mt-5 flex flex-col gap-3 text-sm text-[#bdd4cb]"><a href="#medicines" className="hover:text-white">Medicines</a><a href="#prescription" className="hover:text-white">Prescription preview</a><a href="#how-it-works" className="hover:text-white">How it works</a></div></div><div><h3 className="text-sm font-extrabold">Information</h3><div className="mt-5 flex flex-col gap-3 text-sm text-[#bdd4cb]"><a href="#faq" className="hover:text-white">FAQs</a><a href="https://github.com/din-arr/MediSaarthi" target="_blank" rel="noreferrer" className="hover:text-white">GitHub repository ↗</a><span>Independent internship demo</span></div></div></div><div className="flex flex-col justify-between gap-3 pt-6 text-xs text-[#a8c7bc] sm:flex-row"><span>© 2026 MediSaarthi. Educational project.</span><span>No real orders, payments or prescription processing.</span></div></div></footer>
    </div>
  );
}
