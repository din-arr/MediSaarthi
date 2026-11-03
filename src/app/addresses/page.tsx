"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AddressDialog, { type Address } from "../../components/customer/AddressDialog";
import PageShell from "../../components/customer/PageShell";
import { useLanguage } from "../../components/LanguageProvider";

type Member = { id: string; name: string; relation: string };

export default function AddressesPage() {
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);
  const load = async () => { const [addressResponse, memberResponse] = await Promise.all([fetch("/api/addresses"), fetch("/api/family")]); setAddresses(await addressResponse.json()); setMembers(await memberResponse.json()); };
  useEffect(() => { void (async () => { const [addressResponse, memberResponse] = await Promise.all([fetch("/api/addresses"), fetch("/api/family")]); setAddresses(await addressResponse.json()); setMembers(await memberResponse.json()); })(); }, []);
  const remove = async (id: string) => { await fetch(`/api/addresses?id=${id}`, { method: "DELETE" }); load(); };
  const makeDefault = async (address: Address) => { await fetch("/api/addresses", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: address.id, familyMemberId: address.familyMemberId, label: address.label, recipientName: address.recipientName, phone: address.phone, line1: address.line1, line2: address.line2, area: address.area, city: address.city, pincode: address.pincode, isDefault: true }) }); load(); };
  return <PageShell title={t.dashboard.addressTitle} description={t.dashboard.addressDescription} action={<button className="primary-button" type="button" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={18} />{t.dashboard.addAddress}</button>}>
    {addresses.length === 0 ? <div className="empty-state flow-card"><span className="empty-icon"><MapPin /></span><h2>{t.dashboard.noAddresses}</h2><p>{t.dashboard.addressDescription}</p><button className="primary-button" type="button" onClick={() => setOpen(true)}>{t.dashboard.addAddress}</button></div> : <div className="address-grid">{addresses.map((address) => <article className="flow-card address-card" key={address.id}><div className="address-card-heading"><span className="icon-tile teal"><MapPin size={19} /></span><div><h2>{address.label || t.dashboard.addresses}</h2>{address.isDefault && <span className="default-badge">{t.dashboard.defaultAddress}</span>}</div></div><strong>{address.recipientName}</strong><p>{address.line1}<br />{address.line2}<br />{address.area}, {address.city} · {address.pincode}</p><div className="address-card-actions"><button className="text-button" type="button" onClick={() => { setEditing(address); setOpen(true); }}><Pencil size={15} />{t.dashboard.edit}</button><button className="text-button" type="button" onClick={() => remove(address.id)}><Trash2 size={15} />{t.dashboard.delete}</button>{!address.isDefault && <button className="text-button" type="button" onClick={() => makeDefault(address)}>{t.dashboard.setDefault}</button>}</div></article>)}</div>}
    <AddressDialog open={open} address={editing} members={members} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
  </PageShell>;
}
