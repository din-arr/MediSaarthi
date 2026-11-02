"use client";

import type { Medicine } from "../app/data/medicines";
import { getMedicineForm, type MedicineForm } from "../lib/medicineImages";

const palettes: Record<string, { soft: string; main: string; dark: string; accent: string }> = {
  "Pain & fever": { soft: "#ffe4e6", main: "#fb7185", dark: "#be123c", accent: "#fecdd3" },
  "Cold & allergy": { soft: "#e0f2fe", main: "#38bdf8", dark: "#0369a1", accent: "#bae6fd" },
  "Digestive health": { soft: "#fef3c7", main: "#f59e0b", dark: "#b45309", accent: "#fde68a" },
  "Diabetes care": { soft: "#ede9fe", main: "#8b5cf6", dark: "#6d28d9", accent: "#ddd6fe" },
  "Heart & blood pressure": { soft: "#fee2e2", main: "#ef4444", dark: "#b91c1c", accent: "#fecaca" },
  "Cholesterol & blood": { soft: "#ffedd5", main: "#f97316", dark: "#c2410c", accent: "#fed7aa" },
  "Vitamins & minerals": { soft: "#ecfccb", main: "#84cc16", dark: "#4d7c0f", accent: "#d9f99d" },
  "Respiratory care": { soft: "#ccfbf1", main: "#14b8a6", dark: "#0f766e", accent: "#99f6e4" },
};

function Artwork({ form, palette }: { form: MedicineForm; palette: { soft: string; main: string; dark: string; accent: string } }) {
  const common = { stroke: palette.dark, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (form === "capsule" || form === "vitamins") return <g {...common}><rect x="38" y="46" width="72" height="28" rx="14" fill={palette.accent} transform="rotate(-25 74 60)"/><path d="m55 42 25 46" stroke={palette.dark} opacity=".45"/><path d="m91 43-25 46" stroke={palette.main} strokeWidth="14" opacity=".85"/>{form === "vitamins" && <path d="M104 83c11-18 25-16 29-14-2 14-13 25-29 14Zm2-1c4-8 9-12 18-12" fill={palette.main}/>}</g>;
  if (form === "syrup") return <g {...common}><path d="M52 43h36l4 55H48l4-55Z" fill={palette.accent}/><path d="M57 35h26v10H57z" fill={palette.main}/><path d="M62 27h16v9H62z" fill={palette.dark}/><path d="M55 62h30v20H55z" fill="white" opacity=".9"/><path d="M61 70h18" stroke={palette.main}/></g>;
  if (form === "inhaler") return <g {...common}><path d="M55 89V55c0-7 5-12 12-12h20v46H55Z" fill={palette.accent}/><path d="M67 43V31c0-5 4-9 9-9h19v16H78c-6 0-11 5-11 11Z" fill={palette.main}/><path d="M87 58h13v23H87z" fill={palette.dark}/><path d="M60 61h14" stroke={palette.main}/></g>;
  if (form === "sachet") return <g {...common}><path d="m47 27 60 8-7 65-61-8Z" fill={palette.main}/><path d="m54 44 43 6" stroke="white" opacity=".8"/><path d="m53 58 34 5" stroke="white" opacity=".8"/><path d="M67 72c8-8 17-4 18 2-7 7-14 8-18-2Z" fill={palette.accent}/><path d="M82 75c4-6 8-9 13-9" stroke={palette.dark}/></g>;
  if (form === "cream") return <g {...common}><path d="M60 42h32l8 52H52l8-52Z" fill={palette.accent}/><path d="M62 35h28v10H62z" fill={palette.main}/><path d="M68 28h16v8H68z" fill={palette.dark}/><path d="M57 65h38v17H57z" fill="white" opacity=".9"/><path d="M67 73h18" stroke={palette.main}/></g>;
  if (form === "drops") return <g {...common}><path d="M59 42h30l4 55H55l4-55Z" fill={palette.accent}/><path d="M64 34h20v10H64z" fill={palette.dark}/><path d="M68 27h12v8H68z" fill={palette.main}/><path d="M74 58c-9 12 0 18 0 18s9-6 0-18Z" fill={palette.main}/></g>;
  return <g {...common}><rect x="38" y="47" width="80" height="52" rx="10" fill={palette.accent}/><path d="M47 58h62v30H47z" fill="white" opacity=".9"/><circle cx="60" cy="73" r="8" fill={palette.main}/><circle cx="84" cy="73" r="8" fill={palette.main}/><circle cx="102" cy="73" r="8" fill={palette.dark}/><path d="M43 47h70" stroke={palette.dark}/></g>;
}

export default function MedicineIllustration({ medicine }: { medicine: Medicine }) {
  const form = getMedicineForm(medicine);
  const palette = palettes[medicine.category] || { soft: "#d1fae5", main: "#10b981", dark: "#047857", accent: "#a7f3d0" };
  return <div role="img" aria-label={`Illustration of a ${form}`} className="relative flex h-[140px] items-center justify-center overflow-hidden rounded-2xl" style={{ background: `radial-gradient(circle at 50% 35%, white 0%, ${palette.soft} 68%)` }}>
    <svg aria-hidden="true" viewBox="0 0 148 124" className="h-full w-full max-w-[190px] drop-shadow-[0_8px_7px_rgba(15,118,110,0.12)]"><circle cx="74" cy="64" r="48" fill={palette.soft}/><Artwork form={form} palette={palette}/></svg>
    <span className="absolute bottom-2 right-2 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-slate-500 backdrop-blur">Illustration only</span>
  </div>;
}
