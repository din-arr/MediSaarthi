"use client";

import type { Role } from "../../../lib/session";

import { Clock, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PharmacistHeader, { ScheduleBadge } from "../../../components/pharmacist/PharmacistHeader";

type QueueOrder = { id: string; number: string; customer: string; patient: string; items: number; schedule: string; store: string; waitingMinutes: number; confidence: number | null };
type Queue = { stats: { waiting: number; medianMinutes: number | null; approvedToday: number; rejectedToday: number }; orders: QueueOrder[] };
type Me = { name: string; role?: Role; user?: { registrationNumber?: string | null } };

export default function PharmacistQueuePage() {
  const [data, setData] = useState<Queue | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [query, setQuery] = useState("");
  const [store, setStore] = useState("");
  const [schedule, setSchedule] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/pharmacist/queue").catch(() => null);
    if (!response?.ok) { setError("Couldn't load the queue. Try logging in again."); return; }
    setError("");
    setData(await response.json());
  }, []);

  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.ok ? response.json() : null).then(setMe);
    const first = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 20_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [load]);

  const stores = useMemo(() => [...new Set(data?.orders.map((order) => order.store) ?? [])].sort(), [data]);
  const orders = (data?.orders ?? []).filter((order) =>
    (!store || order.store === store) && (!schedule || order.schedule === schedule) &&
    (!query || `${order.number} ${order.customer} ${order.patient}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <main className="customer-home">
      <PharmacistHeader name={me?.name} regNo={me?.user?.registrationNumber} role={me?.role} />
      <div className="customer-content page-content">
        <div className="page-heading">
          <div><h1>Verification queue</h1><p>Oldest first. Every Schedule H and H1 item needs your decision.</p></div>
          <button className="secondary-button" type="button" onClick={load}><RefreshCw size={16} /> Refresh</button>
        </div>

        <section className="ph-stats">
          <Stat label="Waiting now" value={data?.stats.waiting ?? "–"} />
          <Stat label="Median time today" value={data?.stats.medianMinutes == null ? "–" : `${data.stats.medianMinutes} min`} hint="Target: under 10 min" />
          <Stat label="Approved today" value={data?.stats.approvedToday ?? "–"} />
          <Stat label="Rejected today" value={data?.stats.rejectedToday ?? "–"} />
        </section>

        <section className="ph-filters">
          <label className="ph-search"><Search size={18} /><input placeholder="Search order ID or customer" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select className="text-input" value={store} onChange={(event) => setStore(event.target.value)}><option value="">All stores</option>{stores.map((name) => <option key={name}>{name}</option>)}</select>
          <select className="text-input" value={schedule} onChange={(event) => setSchedule(event.target.value)}><option value="">All schedules</option><option value="H1">Schedule H1</option><option value="H">Schedule H</option><option value="OTC">OTC only</option></select>
        </section>

        {error && <p className="form-error">{error}</p>}
        {!data ? <div className="home-skeleton"><span /><span /><span /></div> : orders.length === 0 ? (
          <div className="empty-state"><strong>All caught up</strong><p>New orders will appear here automatically.</p></div>
        ) : (
          <div className="ph-table" role="table">
            <div className="ph-row ph-head" role="row"><span>Order</span><span>Customer</span><span>Items</span><span>Schedule</span><span>Store</span><span>Waiting</span><span>AI read</span><span /></div>
            {orders.map((order) => (
              <Link className="ph-row" role="row" key={order.id} href={`/pharmacist/orders/${order.id}`}>
                <span className="ph-strong">{order.number}</span>
                <span><span className="ph-strong">{order.customer}</span><small>for {order.patient}</small></span>
                <span>{order.items}</span>
                <span><ScheduleBadge schedule={order.schedule} /></span>
                <span>{order.store}</span>
                <span className={`ph-wait ${order.waitingMinutes > 30 ? "late" : order.waitingMinutes > 10 ? "slow" : ""}`}><Clock size={14} /> {formatWait(order.waitingMinutes)}</span>
                <span>{order.confidence == null ? "–" : <span className={order.confidence < 0.8 ? "ph-low" : ""}>{Math.round(order.confidence * 100)}%</span>}</span>
                <span className="ph-open">Review →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="ph-stat"><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>;
}

function formatWait(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? (minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`) : `${Math.floor(hours / 24)} d`;
}
