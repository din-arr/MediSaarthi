"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { AlertCircle, Check, CloudUpload, FileText, LoaderCircle, LockKeyhole, MapPin, Smartphone, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../../components/customer/PageShell";
import { useLanguage } from "../../components/LanguageProvider";
import AddressDialog, { type Address } from "../../components/customer/AddressDialog";

type Draft = { productId: string; name: string; strength: string; quantity: number; confidence: number; schedule: string };
type Stage = "upload" | "review" | "place";

export default function UploadPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string; relation: string }>>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [draft, setDraft] = useState<Draft[]>([]);
  const [prescriptionId, setPrescriptionId] = useState("");
  const [stage, setStage] = useState<Stage>("upload");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [routingMessage, setRoutingMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [addressAttention, setAddressAttention] = useState(false);

  useEffect(() => { fetch("/api/family").then((r) => r.json()).then(setMembers); fetch("/api/addresses").then((r) => r.json()).then((value: Address[]) => { setAddresses(value); setAddressId(value.find((item) => item.isDefault)?.id ?? value[0]?.id ?? ""); }); }, []);
  useEffect(() => {
    if (!addressId || !draft.length) return;
    void fetch("/api/orders/routing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ addressId, items: draft.map((item) => ({ productId: item.productId, quantity: item.quantity })) }) }).then((response) => response.json()).then((result: { storeName?: string; distanceKm?: number; routingReason?: string; error?: string }) => setRoutingMessage(result.storeName ? `${result.storeName} · ${result.distanceKm?.toFixed(1)} km · ${t.dashboard.sameDay}` : result.error ?? ""));
  }, [addressId, draft, t.dashboard.sameDay]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const choose = (candidate?: File) => {
    if (!candidate) return;
    if (candidate.size > 4 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(candidate.type)) {
      setError(t.dashboard.uploadHint);
      return;
    }
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setFile(candidate);
    setPreview(candidate.type.startsWith("image/") ? URL.createObjectURL(candidate) : "");
  };

  const upload = async () => {
    if (!file) { setError(t.dashboard.uploadHint); return; }
    setLoading(true); setProgress(15);
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + 15, 85)), 180);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/prescriptions", { method: "POST", body });
      const result = await response.json() as { prescriptionId?: string; draft?: Draft[]; error?: string };
      if (response.status === 401 && result.error === "SESSION_EXPIRED") { router.push("/?auth=login&reason=session-expired"); return; }
      if (!response.ok) throw new Error(result.error ?? t.auth.loginError);
      setPrescriptionId(result.prescriptionId ?? ""); setDraft(result.draft ?? []); setProgress(100); setStage("review");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.auth.loginError); }
    finally { window.clearInterval(timer); setLoading(false); }
  };

  const place = async () => {
    if (!addressId) {
      setAddressAttention(true);
      document.getElementById("deliver-to-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
      setAddressDialogOpen(true);
      window.setTimeout(() => setAddressAttention(false), 1200);
      return;
    }
    if (draft.some((item) => item.schedule === "X")) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prescriptionId, familyMemberId: familyMemberId || undefined, addressId: addressId || undefined, items: draft.map((item) => ({ productId: item.productId, quantity: item.quantity })) }) });
      const result = await response.json() as { id?: string; routingReason?: string; missingItems?: string[]; error?: string };
      if (response.status === 401 && result.error === "SESSION_EXPIRED") { router.push("/?auth=login&reason=session-expired"); return; }
      if (!response.ok) throw new Error(result.error ?? t.auth.loginError);
      setRoutingMessage(result.routingReason ?? "");
      setStage("place");
      window.setTimeout(() => router.push(`/orders/${result.id}`), reduced ? 0 : 350);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.auth.loginError); setLoading(false); }
  };

  const clearFile = () => { if (preview) URL.revokeObjectURL(preview); setPreview(""); setFile(null); setDraft([]); setStage("upload"); setProgress(0); };
  const motionProps = reduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: .3 } };

  return <PageShell title={t.dashboard.uploadTitle} description="Upload a clear prescription and we’ll prepare it for a pharmacist to review.">
    <div className="upload-layout">
      <motion.section className="flow-card upload-card" {...motionProps}>
        <div className="upload-stepper">{(["upload", "review", "place"] as Stage[]).map((item, index) => <div className={stage === item || (stage === "review" && index === 0) || (stage === "place" && index < 2) ? "upload-step active" : "upload-step"} key={item}><span>{index < (stage === "place" ? 2 : stage === "review" ? 1 : 0) ? <Check size={14} /> : index + 1}</span>{item === "upload" ? "Upload" : item === "review" ? "Review draft" : "Place order"}</div>)}</div>
        <div className="upload-section"><h2>{t.dashboard.chooseFor}</h2><div className="family-chips"><button className={!familyMemberId ? "selected" : ""} type="button" onClick={() => { setFamilyMemberId(""); const own = addresses.find((item) => !item.familyMemberId); if (own) setAddressId(own.id); }}>{t.dashboard.familyMe}</button>{members.map((member) => <button className={familyMemberId === member.id ? "selected" : ""} type="button" key={member.id} onClick={() => { setFamilyMemberId(member.id); const match = addresses.find((item) => item.familyMemberId === member.id); if (match) setAddressId(match.id); }}>{member.name} · {member.relation}</button>)}</div></div>
        <AnimatePresence mode="wait" initial={false}>
          {!file && <motion.div key="drop" className={`drop-zone upload-drop-zone ${dragging ? "dragging" : ""}`} {...motionProps} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()}><CloudUpload size={44} strokeWidth={1.5} /><strong>Drag your prescription here or browse</strong><span>JPG, PNG or PDF · up to 4 MB</span><button type="button" className="secondary-button mobile-photo" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><Smartphone size={17} />Take a photo</button><input ref={inputRef} hidden type="file" accept=".jpg,.jpeg,.png,.pdf" capture="environment" onChange={(event) => choose(event.target.files?.[0])} /></motion.div>}
          {file && !draft.length && <motion.div key="file" className="selected-file-card" {...motionProps}><div className="file-thumb">{preview ? <Image src={preview} alt="" width={64} height={72} unoptimized /> : <FileText size={30} />}</div><div className="file-details"><strong title={file.name}>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB</span><button type="button" className="text-button" onClick={() => inputRef.current?.click()}>Change</button></div><button className="icon-button" type="button" aria-label="Remove file" onClick={clearFile}><X size={19} /></button><input ref={inputRef} hidden type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => choose(event.target.files?.[0])} /></motion.div>}
        </AnimatePresence>
        {loading && <div className="upload-progress" aria-label="Uploading"><div style={{ width: `${progress}%` }} /><span>{progress}%</span></div>}
        {error && <div className="upload-error" role="alert"><AlertCircle size={20} /><div><strong>We couldn’t process that</strong><p>{error}</p><button type="button" className="text-button" onClick={() => setError("")}>Try again</button></div></div>}
        {file && !draft.length && <button className="auth-primary upload-continue" type="button" disabled={loading} onClick={upload}>{loading ? <LoaderCircle className="button-spinner" /> : "Continue"}</button>}
        {draft.length > 0 && <motion.div className="draft-list" {...motionProps}><p className="draft-note">{t.dashboard.draftNote}</p>{draft.map((item, index) => <div className="draft-row" key={item.productId}><div><strong>{item.name} {item.strength}</strong><span className={`schedule-badge schedule-${item.schedule}`}>{item.schedule}</span>{item.schedule === "X" && <small className="blocked-note">{t.dashboard.cannotSellOnline}</small>}{item.confidence < .8 && <small>{t.dashboard.lowConfidence}</small>}</div><input aria-label={item.name} type="number" min="1" value={item.quantity} onChange={(event) => setDraft((items) => items.map((current, position) => position === index ? { ...current, quantity: Math.max(1, Number(event.target.value)) } : current))} /></div>)}<div id="deliver-to-card" className={`checkout-address-card order-deliver-card ${addressAttention ? "address-attention" : ""}`}><div className="deliver-icon"><MapPin size={20} /></div><div className="deliver-copy"><strong>{t.dashboard.deliverTo}</strong>{addresses.find((item) => item.id === addressId) ? <p>{addresses.find((item) => item.id === addressId)?.label} · {addresses.find((item) => item.id === addressId)?.area} · {addresses.find((item) => item.id === addressId)?.pincode}</p> : <p>{t.dashboard.noAddresses}</p>}{routingMessage && <p className="routing-preview">Delivering from {routingMessage}</p>}</div><button className="text-button" type="button" onClick={() => addresses.length ? setAddressPickerOpen((value) => !value) : setAddressDialogOpen(true)}>{addresses.length ? t.dashboard.changeAddress : `+ ${t.dashboard.addDeliveryAddress}`}</button>{addressPickerOpen && <div className="address-picker">{addresses.map((address) => <label key={address.id}><input type="radio" checked={address.id === addressId} onChange={() => { setAddressId(address.id); setAddressPickerOpen(false); }} />{address.label} · {address.area} · {address.pincode}</label>)}<button type="button" className="text-button" onClick={() => { setAddressPickerOpen(false); setAddressDialogOpen(true); }}>+ {t.dashboard.addDeliveryAddress}</button></div>}</div><button className="auth-primary upload-continue" disabled={draft.some((item) => item.schedule === "X") || loading} type="button" onClick={place}>{loading ? <LoaderCircle className="button-spinner" /> : t.dashboard.placeOrder}</button></motion.div>}
        {stage === "place" && <div className="upload-success"><Check size={28} /><span>{routingMessage || "Order created"}<small> · Same-day delivery</small></span></div>}
      </motion.section>
      <motion.aside className="next-panel" {...motionProps}><div className="next-panel-heading"><UploadCloud size={24} /><h2>What happens next</h2></div><div className="next-steps">{[["1", "Upload", "Share a clear prescription."], ["2", "AI drafts the items", "We match names and quantities."], ["3", "Pharmacist verifies", "A trained pharmacist checks every item."], ["4", "Nearest store packs it", "Stock is found close to you."]].map(([number, title, description]) => <div className="next-step" key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}</div><div className="privacy-note"><LockKeyhole size={18} /><span>Encrypted · only pharmacists can view</span></div></motion.aside>
    </div>
    <AddressDialog open={addressDialogOpen} familyMemberId={familyMemberId} members={members} onClose={() => setAddressDialogOpen(false)} onSaved={(address) => { setAddresses((current) => { const next = current.filter((item) => item.id !== address.id); return [address, ...next]; }); setAddressId(address.id); }} />
  </PageShell>;
}
