"use client";

import { ChevronDown, Mail, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";
import { supportConfig } from "../../lib/serviceArea";

const faqs = [
  ["Where is my order?", "Open your order timeline for the latest pharmacist, packing and delivery update."],
  ["Why was my prescription rejected?", "A pharmacist may reject an unclear or unsafe prescription and will explain what needs changing."],
  ["How do I re-upload?", "Use Upload prescription from your home screen and submit a clearer or updated prescription."],
  ["When will it be delivered?", "Approved orders are packed by the nearest store for same-day delivery where available."],
  ["Can I order for my parents?", "Yes. Add a family member and choose them when uploading or reordering."],
];

export default function HelpPanel({ open, orderNumber, storePhone, onClose }: { open: boolean; orderNumber?: string; storePhone?: string | null; onClose: () => void }) {
  const [expanded, setExpanded] = useState("");
  if (!open) return null;
  const subject = encodeURIComponent(`Help with order ${orderNumber ?? ""}`.trim());
  const message = encodeURIComponent(`Hello MediSaarthi, I need help with order ${orderNumber ?? ""}.`);
  return <div className="help-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <aside className="help-panel" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="dialog-heading"><div><p className="eyebrow">MediSaarthi support</p><h2 id="help-title">Need help?</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <div className="help-actions">
        <a href={`mailto:${supportConfig.email}?subject=${subject}`}><Mail size={19} /><span>Email us<small>{supportConfig.email}</small></span></a>
        {storePhone && <a href={`tel:${storePhone}`}><Phone size={19} /><span>Call your store<small>{storePhone}</small></span></a>}
        <a href={`https://wa.me/${supportConfig.whatsapp}?text=${message}`} target="_blank" rel="noreferrer"><MessageCircle size={19} /><span>WhatsApp us<small>Chat with support</small></span></a>
      </div>
      <div className="help-faqs">{faqs.map(([question, answer]) => <div className="help-faq" key={question}><button type="button" onClick={() => setExpanded(expanded === question ? "" : question)}><span>{question}</span><ChevronDown size={17} className={expanded === question ? "rotate-180" : ""} /></button>{expanded === question && <p>{answer}</p>}</div>)}</div>
      <p className="help-note">For medical questions, please speak to your doctor or pharmacist.</p>
    </aside>
  </div>;
}
