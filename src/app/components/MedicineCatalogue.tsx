"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Info, Search as SearchIcon,
} from "lucide-react";
import { medicines, type Medicine } from "../data/medicines";
import MedicineIllustration from "../../components/MedicineIllustration";
import { getMedicineForm, medicineImages } from "../../lib/medicineImages";
import { useLanguage } from "../../components/LanguageProvider";

const categories = ["All", ...Array.from(new Set(medicines.map((m) => m.category)))];
const featuredIds = [1, 16, 31, 46, 61, 76, 91, 121];
const pageSize = 12;

const categoryPhotoGradient: Record<string, string> = {
  "Pain & fever": "from-rose-900/35",
  "Cold & allergy": "from-sky-900/35",
  "Digestive health": "from-amber-900/35",
  "Diabetes care": "from-violet-900/35",
  "Heart & blood pressure": "from-red-900/35",
  "Cholesterol & blood": "from-orange-900/35",
  "Vitamins & minerals": "from-lime-900/35",
  "Respiratory care": "from-teal-900/35",
};

function MedicineHeader({ medicine }: { medicine: Medicine }) {
  const form = getMedicineForm(medicine);
  const image = medicineImages[form];
  if (!image) return <MedicineIllustration medicine={medicine} />;
  return <div className="medicine-photo relative h-[140px] overflow-hidden rounded-2xl bg-slate-100">
    <Image src={image} alt={`Representative photo of ${form}, not the actual product`} fill sizes="(min-width:1280px) 25vw, (min-width:640px) 50vw, 100vw" loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-105" />
    <div className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${categoryPhotoGradient[medicine.category] || "from-emerald-900/35"} to-transparent`} />
    <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-slate-600 shadow-sm">Representative image</span>
  </div>;
}

export default function MedicineCatalogue() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [filter, setFilter] = useState("All types");
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [showAll, setShowAll] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const results = useMemo(() => medicines.filter((m) =>
    (category === "All" || m.category === category) &&
    (filter === "All types" || (filter === "Prescription" ? m.rx : !m.rx)) &&
    `${m.name} ${m.category}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [search, category, filter]);
  const hasActiveFilters = Boolean(search.trim()) || category !== "All" || filter !== "All types";
  const visibleResults = hasActiveFilters || showAll
    ? results
    : results.filter((medicine) => featuredIds.includes(medicine.id));
  const resetView = () => setShowAll(false);

  useEffect(() => {
    if (!selected) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <section id="medicines" className="bg-[#f5faf8] py-20 text-[#153d36] dark:bg-[#071513] dark:text-emerald-50 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-emerald-700">{hasActiveFilters ? t.sections.catalogueEyebrow : t.sections.catalogueEyebrow}</p>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.sections.catalogueTitle}</h2>
          <p className="mt-4 text-[17px] leading-7 text-slate-600 dark:text-slate-300">{t.sections.catalogueDescription}</p>
        </div>
        <div className="mb-7 grid gap-3 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1f1c] sm:grid-cols-2 lg:grid-cols-[1fr_240px_190px]">
          <label className="sr-only" htmlFor="medicine-search">Search medicines</label>
          <div className="relative"><SearchIcon aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" /><input id="medicine-search" value={search} onChange={(e) => {setSearch(e.target.value); resetView();}} placeholder="Search all 150 medicines or categories..." className="min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#12302b] dark:text-white dark:placeholder:text-slate-400" /></div>
          <label className="sr-only" htmlFor="medicine-category">Category</label>
          <select id="medicine-category" value={category} onChange={(e) => {setCategory(e.target.value); resetView();}} className="min-h-12 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#12302b] dark:text-white">{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <label className="sr-only" htmlFor="medicine-type">Prescription filter</label>
          <select id="medicine-type" value={filter} onChange={(e) => {setFilter(e.target.value); resetView();}} className="min-h-12 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#12302b] dark:text-white">{["All types", "Prescription", "Non-prescription"].map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><p aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">{hasActiveFilters ? `${results.length} matching medicines` : `Showing ${visibleResults.length} featured medicines`}</p>{!hasActiveFilters && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Search and filters include all {medicines.length}</span>}</div>
        {results.length === 0 ? <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center dark:border-white/10 dark:bg-[#0d1f1c]"><p>No matching medicines found.</p><button type="button" onClick={()=>{setSearch("");setCategory("All");setFilter("All types");}} className="mt-4 min-h-11 rounded-xl bg-[#134e4a] px-5 py-3 text-sm font-bold text-white">Clear filters</button></div> : null}
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
          {visibleResults.slice(0, showAll || hasActiveFilters ? undefined : pageSize).map((m) => <motion.article layout key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="medicine-card reveal-on-scroll group flex h-full flex-col rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#0d1f1c]">
            <MedicineHeader medicine={m} />
            <div className="mt-4 flex items-start justify-between gap-2"><span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{m.category}</span><span title={m.rx ? "Needs a valid prescription and pharmacist review" : "Check local rules"} className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${m.rx ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"}`}>{m.rx ? "Rx – review needed" : "Check local rules"}</span></div>
            <h3 className="mt-3 min-h-12 text-lg font-bold leading-snug">{m.name}</h3>
            <button type="button" onClick={() => setSelected(m)} className="mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">View details <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></button>
          </motion.article>)}
          </AnimatePresence>
        </motion.div>
        {!hasActiveFilters && <div className="mt-10 text-center"><button type="button" onClick={() => setShowAll((value) => !value)} className="rounded-full border border-emerald-300 bg-white px-8 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50">{showAll ? "Show featured only" : "Browse all 150 medicines"}</button></div>}
        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-[#0d1f1c] dark:text-slate-300"><Info size={19} className="mt-0.5 shrink-0 text-emerald-700" /><p>Educational catalogue only. Medicine names and strengths are examples, not prescribing advice. Prescription classifications vary by jurisdiction; non-prescription labels here are not a guarantee of OTC availability. Never use an image to identify or select a medicine.</p></div>
        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Photos show the medicine form only. Always check the name and strength on your actual pack.</p>
      </div>
      {selected && <div role="presentation" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => {if(e.target === e.currentTarget) setSelected(null);}}>
        <div role="dialog" aria-modal="true" aria-labelledby="medicine-dialog-title" className="medicine-dialog max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4"><h3 id="medicine-dialog-title" className="text-2xl font-bold">{selected.name}</h3><button ref={closeButtonRef} type="button" aria-label="Close details" onClick={() => setSelected(null)} className="rounded-lg border px-3 py-1 text-xl">×</button></div>
          <p className="mt-3 text-sm text-emerald-700">{selected.category}</p>
          <div className="mt-5"><MedicineHeader key={selected.id} medicine={selected} /></div>
          <p className="mt-5 text-sm leading-7 text-slate-600">This is a sample catalogue entry, not an approved product listing. Dosage, suitability, interactions, and local prescription requirements must be checked by a licensed clinician or pharmacist. No purchases or uploads are supported here.</p>
          <button type="button" onClick={() => setSelected(null)} className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white">Close</button>
        </div>
      </div>}
    </section>
  );
}
