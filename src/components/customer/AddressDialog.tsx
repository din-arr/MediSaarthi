"use client";

import { LocateFixed, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../LanguageProvider";

export type Address = {
  id: string;
  familyMemberId?: string | null;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  area: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
};

type Member = { id: string; name: string; relation: string };
type Props = { open: boolean; address?: Address | null; familyMemberId?: string; members?: Member[]; onClose: () => void; onSaved: (address: Address) => void };

const labels = ["Home", "Work", "Mother's home", "Other"];

export default function AddressDialog({ open, address, familyMemberId, members = [], onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ label: "", familyMemberId: familyMemberId ?? "", recipientName: "", phone: "", line1: "", line2: "", area: "", city: "", pincode: "", isDefault: false });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [locationMessage, setLocationMessage] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const member = members.find((item) => item.id === (address?.familyMemberId ?? familyMemberId));
      setForm({ label: address?.label ?? "", familyMemberId: address?.familyMemberId ?? familyMemberId ?? "", recipientName: address?.recipientName ?? member?.name ?? "", phone: address?.phone ?? "", line1: address?.line1 ?? "", line2: address?.line2 ?? "", area: address?.area ?? "", city: address?.city ?? "", pincode: address?.pincode ?? "", isDefault: address?.isDefault ?? false });
      setError("");
      setFieldErrors({});
      setLocationMessage("");
    });
    return () => window.clearTimeout(timer);
  }, [open, address, familyMemberId, members]);

  if (!open) return null;
  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const lookup = async (value: string) => {
    update("pincode", value.replace(/\D/g, "").slice(0, 6));
    if (value.replace(/\D/g, "").length !== 6) return;
    setPinLoading(true);
    const response = await fetch(`/api/addresses?pincode=${value}`);
    const result = await response.json() as { area?: string; city?: string; error?: string; hint?: string };
    setPinLoading(false);
    if (!response.ok) { setError(result.error ?? t.dashboard.pincodeUnavailable); update("area", ""); update("city", ""); return; }
    setError(""); setFieldErrors((current) => ({ ...current, pincode: "" })); update("area", result.area ?? ""); update("city", result.city ?? ""); setLocationMessage(result.hint ?? "");
  };
  const locate = () => {
    if (!navigator.geolocation) { setError("Location is not available in this browser."); return; }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const response = await fetch(`/api/addresses?lat=${coords.latitude}&lng=${coords.longitude}`);
      const result = await response.json() as { code?: string; city?: string; error?: string; detected?: string };
      if (!response.ok || !result.code) { setError(result.error ?? t.dashboard.pincodeUnavailable); return; }
      await lookup(result.code);
      setLocationMessage(result.detected ?? "");
    }, (positionError) => setError(positionError.code === 1 ? "Location permission was denied. Enter your pincode instead." : "We couldn't determine your location. Enter your pincode instead."), { enableHighAccuracy: false, timeout: 8000 });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(""); setFieldErrors({});
    const response = await fetch("/api/addresses", { method: address ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, id: address?.id }) });
    const result = await response.json() as Address & { error?: string };
    setSaving(false);
    if (!response.ok) { setError(result.error ?? t.auth.loginError); setFieldErrors((result as Address & { fieldErrors?: Record<string, string> }).fieldErrors ?? {}); return; }
    onSaved(result); onClose();
  };
  const field = (name: string) => fieldErrors[name] ? <small className="field-error">{fieldErrors[name]}</small> : null;
  return <div className="address-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="address-dialog" role="dialog" aria-modal="true" aria-labelledby="address-dialog-title">
      <div className="dialog-heading"><div><p className="eyebrow">{t.dashboard.addresses}</p><h2 id="address-dialog-title">{address ? t.dashboard.editAddress : t.dashboard.addAddress}</h2></div><button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
      <form onSubmit={submit} className="address-form">
        <div><span className="field-label">{t.dashboard.addressLabel}</span><div className="label-chips">{labels.map((label) => <button type="button" key={label} className={form.label === label ? "selected" : ""} onClick={() => update("label", form.label === label ? "" : label)}>{label}</button>)}</div>{field("label")}</div>
        {members.length > 0 && <label className="field-label">{t.dashboard.familyMembers}<select name="familyMemberId" className="text-input" value={form.familyMemberId} onChange={(event) => { const member = members.find((item) => item.id === event.target.value); update("familyMemberId", event.target.value); if (member) update("recipientName", member.name); }}><option value="">Me</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.relation}</option>)}</select></label>}
        <label className="field-label">{t.dashboard.recipientName}<input name="recipientName" className="text-input" value={form.recipientName} onChange={(event) => update("recipientName", event.target.value)} required />{field("recipientName")}</label>
        <label className="field-label">Phone (+91)<div className="phone-input"><span>+91</span><input name="phone" inputMode="numeric" maxLength={10} value={form.phone} onChange={(event) => update("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} required /></div>{field("phone")}</label>
        <label className="field-label">{t.dashboard.houseFlat}<input name="line1" className="text-input" value={form.line1} onChange={(event) => update("line1", event.target.value)} required />{field("line1")}</label>
        <label className="field-label">{t.dashboard.streetLandmark}<input name="line2" className="text-input" value={form.line2} onChange={(event) => update("line2", event.target.value)} required />{field("line2")}</label>
        <div className="address-fields"><label className="field-label">{t.dashboard.pincode}<input name="pincode" className="text-input" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(event) => lookup(event.target.value)} required />{field("pincode")}</label><label className="field-label">{t.dashboard.area}<input name="area" className="text-input" value={pinLoading ? "Looking up…" : form.area} onChange={(event) => update("area", event.target.value)} required />{locationMessage && <small className="field-hint">{locationMessage}</small>}{field("area")}</label><label className="field-label">{t.dashboard.city}<select name="city" className="text-input" value={form.city} onChange={(event) => update("city", event.target.value)} required><option value="">{t.more.chooseCity}</option><option value="Kolkata">{t.more.kolkata}</option><option value="Howrah">{t.more.howrah}</option></select>{field("city")}</label></div>
        <button type="button" className="secondary-button location-button" onClick={locate}><LocateFixed size={18} />{t.dashboard.useLocation}</button>
        <label className="switch-row"><input type="checkbox" checked={form.isDefault} onChange={(event) => update("isDefault", event.target.checked)} />{t.dashboard.setDefault}</label>
        {error && <p className="form-error"><MapPin size={17} />{error}</p>}
        <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>{t.dashboard.cancel}</button><button className="auth-primary" type="submit" disabled={saving}>{saving ? t.auth.loading : t.dashboard.saveAddress}</button></div>
      </form>
    </section>
  </div>;
}
