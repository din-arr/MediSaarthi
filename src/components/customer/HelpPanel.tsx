"use client";

import { ChevronDown, Mail, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";
import { supportConfig } from "../../lib/serviceArea";
import { useLanguage } from "../LanguageProvider";


export default function HelpPanel({ open, orderNumber, storePhone, onClose }: { open: boolean; orderNumber?: string; storePhone?: string | null; onClose: () => void }) {
  const [expanded, setExpanded] = useState("");
  const { t } = useLanguage();
  const m = t.more;
  const faqs = [[m.faqWhereQ, m.faqWhereA], [m.faqRejectQ, m.faqRejectA], [m.faqReuploadQ, m.faqReuploadA], [m.faqWhenQ, m.faqWhenA], [m.faqParentsQ, m.faqParentsA]];
  if (!open) return null;
  const subject = encodeURIComponent(`Help with order ${orderNumber ?? ""}`.trim());
  const message = encodeURIComponent(`Hello MediSaarthi, I need help with order ${orderNumber ?? ""}.`);
  return <div className="help-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <aside className="help-panel" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="dialog-heading"><div><p className="eyebrow">{m.helpEyebrow}</p><h2 id="help-title">{m.helpTitle}</h2></div><button className="icon-button" onClick={onClose} aria-label={m.close}><X size={20} /></button></div>
      <div className="help-actions">
        <a href={`mailto:${supportConfig.email}?subject=${subject}`}><Mail size={19} /><span>{m.helpEmail}<small>{supportConfig.email}</small></span></a>
        {storePhone && <a href={`tel:${storePhone}`}><Phone size={19} /><span>{m.helpCall}<small>{storePhone}</small></span></a>}
        <a href={`https://wa.me/${supportConfig.whatsapp}?text=${message}`} target="_blank" rel="noreferrer"><MessageCircle size={19} /><span>{m.helpWhatsapp}<small>{m.helpChat}</small></span></a>
      </div>
      <div className="help-faqs">{faqs.map(([question, answer]) => <div className="help-faq" key={question}><button type="button" onClick={() => setExpanded(expanded === question ? "" : question)}><span>{question}</span><ChevronDown size={17} className={expanded === question ? "rotate-180" : ""} /></button>{expanded === question && <p>{answer}</p>}</div>)}</div>
      <p className="help-note">{m.helpMedical}</p>
    </aside>
  </div>;
}
