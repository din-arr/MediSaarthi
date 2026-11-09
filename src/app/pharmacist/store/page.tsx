"use client";

import type { Role } from "../../../lib/session";

import { Bike, CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PharmacistHeader, { ScheduleBadge } from "../../../components/pharmacist/PharmacistHeader";
import { useStaffText } from "../../../components/pharmacist/useStaffText";

type StoreOrder = { id: string; number: string; status: "APPROVED" | "PACKED" | "OUT_FOR_DELIVERY"; store: string; patient: string; phone: string; address: string; paymentMethod: string | null; paymentStatus: string; total: number; invoiceNumber: string | null; riderName: string | null; items: Array<{ id: string; name: string; pack: string; quantity: number; schedule: string }> };
type Data = { stores: Array<{ id: string; name: string }>; orders: StoreOrder[] };

const columns = [
  { status: "APPROVED", title: "To pick and pack", icon: PackageCheck },
  { status: "PACKED", title: "Ready for handover", icon: Bike },
  { status: "OUT_FOR_DELIVERY", title: "Out for delivery", icon: Truck },
] as const;

export default function StorePage() {
  const [data, setData] = useState<Data | null>(null);
  const [store, setStore] = useState("");
  const s = useStaffText();
  const [me, setMe] = useState<{ name: string; role?: Role; user?: { registrationNumber?: string | null } } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/pharmacist/store${store ? `?store=${store}` : ""}`).catch(() => null);
    if (response?.ok) setData(await response.json());
  }, [store]);

  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.ok ? response.json() : null).then(setMe);
    const first = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 20_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [load]);

  return (
    <main className="customer-home">
      <PharmacistHeader name={me?.name} regNo={me?.user?.registrationNumber} role={me?.role} />
      <div className="customer-content page-content">
        <div className="page-heading">
          <div><h1>{s("Store orders")}</h1><p>{me?.role === "OPS" ? s("View only. Store staff pick, pack and hand over orders.") : s("Pick the approved items, pack with the store invoice number, then hand over to the rider.")}</p></div>
          {me?.role === "STORE_STAFF" ? <span className="text-input store-select">{data?.stores[0]?.name ?? s("Your store")}</span> : <select className="text-input store-select" value={store} onChange={(event) => setStore(event.target.value)}>
            <option value="">{s("All 46 stores")}</option>
            {data?.stores.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>}
        </div>
        {!data ? <div className="home-skeleton"><span /><span /></div> : (
          <div className="store-board">
            {columns.map((column) => {
              const list = data.orders.filter((order) => order.status === column.status);
              return (
                <section className="store-column" key={column.status}>
                  <h2><column.icon size={18} /> {s(column.title)} <span className="count-pill">{list.length}</span></h2>
                  {list.length === 0 ? <p className="empty-copy">{s("Nothing here right now.")}</p> : list.map((order) => <StoreCard key={order.id} order={order} onDone={load} readOnly={me?.role === "OPS"} />)}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StoreCard({ order, onDone, readOnly = false }: { order: StoreOrder; onDone: () => void; readOnly?: boolean }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [invoice, setInvoice] = useState("");
  const [rider, setRider] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = useStaffText();
  const allPicked = picked.length === order.items.length;

  const move = async (status: string) => {
    setBusy(true); setError("");
    const response = await fetch(`/api/orders/${order.id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, invoiceNumber: invoice, riderName: rider }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setError(result.error); return; }
    onDone();
  };

  return (
    <article className="flow-card store-card">
      <div className="store-card-head">
        <div><strong>{order.number}</strong><small>{order.store} · {order.patient}</small></div>
        <span className={`status-pill ${order.paymentStatus === "PAID" ? "approved" : "pending"}`}>{order.paymentStatus === "PAID" ? s("Paid") : order.paymentMethod === "COD" ? s("COD ₹{n}", { n: order.total }) : s("Awaiting payment")}</span>
      </div>

      {readOnly && <>
        <ul className="pick-list">{order.items.map((item) => <li key={item.id}><span><strong>{item.quantity} × {item.name}</strong><small>{item.pack}</small></span> <ScheduleBadge schedule={item.schedule} /></li>)}</ul>
        <p className="muted-small">{[order.invoiceNumber && s("Invoice {no}", { no: order.invoiceNumber }), order.riderName && s("With {name}", { name: order.riderName }), order.address].filter(Boolean).join(" · ")}</p>
      </>}

      {!readOnly && order.status === "APPROVED" && <>
        <ul className="pick-list">
          {order.items.map((item) => (
            <li key={item.id}><label>
              <input type="checkbox" checked={picked.includes(item.id)} onChange={(event) => setPicked(event.target.checked ? [...picked, item.id] : picked.filter((id) => id !== item.id))} />
              <span><strong>{item.quantity} × {item.name}</strong><small>{item.pack}</small></span>
              <ScheduleBadge schedule={item.schedule} />
            </label></li>
          ))}
        </ul>
        <label className="field-label">{s("Store invoice no.")}<input className="text-input" placeholder="e.g. SL-2026-0412" value={invoice} onChange={(event) => setInvoice(event.target.value)} /></label>
        <button className="auth-primary" type="button" disabled={busy || !allPicked || !invoice.trim() || !order.paymentMethod} onClick={() => move("PACKED")}>{s("Mark packed")}</button>
        {!order.paymentMethod && <small className="muted-small">{s("Waiting for the customer to choose UPI or cash on delivery.")}</small>}
        {order.paymentMethod && !allPicked && <small className="muted-small">{s("Tick every item as you pick it.")}</small>}
      </>}

      {!readOnly && order.status === "PACKED" && <>
        <p className="muted-small">{s("Invoice {no}", { no: order.invoiceNumber ?? "" })} · {order.address}</p>
        <label className="field-label">{s("Rider")}<input className="text-input" placeholder={s("Rider's name")} value={rider} onChange={(event) => setRider(event.target.value)} /></label>
        <button className="auth-primary" type="button" disabled={busy || !rider.trim()} onClick={() => move("OUT_FOR_DELIVERY")}>{s("Hand over to rider")}</button>
      </>}

      {!readOnly && order.status === "OUT_FOR_DELIVERY" && <>
        <p className="muted-small">{s("With {name}", { name: order.riderName ?? "" })} · {order.address} · {order.phone}</p>
        <button className="secondary-button" type="button" disabled={busy} onClick={() => move("DELIVERED")}><CheckCircle2 size={16} /> {s(order.paymentMethod === "COD" ? "Mark delivered (cash collected)" : "Mark delivered")}</button>
      </>}

      {error && <p className="form-error">{error}</p>}
    </article>
  );
}
