"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import PharmacistHeader from "../../../components/pharmacist/PharmacistHeader";

type StoreRow = { id: string; name: string; total: number; waiting: number; inProgress: number; delivered: number; rejected: number; medianMinutes: number | null };
type Data = { days: number; totals: { orders: number; waiting: number; delivered: number; rejected: number; reuploads: number; medianMinutes: number | null; within10: number | null; unsafeDispatches: number }; unsafe: string[]; reasons: Array<{ reason: string; count: number }>; byStore: StoreRow[] };

const fmt = (value: number | null) => value === null ? "–" : `${Math.round(value)} min`;

export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [reminder, setReminder] = useState("");
  const runReminders = async () => { const response = await fetch("/api/pharmacist/reminders", { method: "POST" }); const result = await response.json(); setReminder(response.ok ? `Checked ${result.checked} refills, sent ${result.sent} reminders.` : result.error); };
  const [me, setMe] = useState<{ name: string; user?: { registrationNumber?: string | null } } | null>(null);

  useEffect(() => { fetch("/api/auth/session").then((response) => response.ok ? response.json() : null).then(setMe); }, []);
  useEffect(() => { fetch(`/api/pharmacist/dashboard?days=${days}`).then((response) => response.ok ? response.json() : null).then(setData); }, [days]);

  const stores = data ? (showAll ? data.byStore : data.byStore.filter((store) => store.total > 0)) : [];
  const busiest = Math.max(1, ...(data?.byStore.map((store) => store.total) ?? [1]));
  const topReason = Math.max(1, ...(data?.reasons.map((reason) => reason.count) ?? [1]));

  return (
    <main className="customer-home">
      <PharmacistHeader name={me?.name} regNo={me?.user?.registrationNumber} />
      <div className="customer-content page-content">
        <div className="page-heading">
          <div><h1>All stores</h1><p>Orders, verification time and rejections across Kolkata and Howrah.</p></div>
          <div className="seg">{[1, 7, 30].map((value) => <button key={value} type="button" className={days === value ? "on" : ""} onClick={() => setDays(value)}>{value === 1 ? "Today" : `${value} days`}</button>)}</div>
        </div>

        {!data ? <div className="home-skeleton"><span /><span /><span /></div> : <>
          <div className={`safety-banner ${data.totals.unsafeDispatches ? "bad" : "good"}`}>
            {data.totals.unsafeDispatches ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
            <div>
              <strong>{data.totals.unsafeDispatches ? `${data.totals.unsafeDispatches} order(s) left a store with an unapproved Schedule H item` : "No Schedule H or H1 item dispatched without approval"}</strong>
              <p>{data.totals.unsafeDispatches ? `Check ${data.unsafe.join(", ")} now.` : "Every prescription medicine that left a store was approved by a registered pharmacist."}</p>
            </div>
          </div>

          <section className="ph-stats">
            <div className="ph-stat"><span>Orders</span><strong>{data.totals.orders}</strong><small>{data.totals.delivered} delivered · {data.totals.waiting} waiting</small></div>
            <div className="ph-stat"><span>Median verification</span><strong className={data.totals.medianMinutes !== null && data.totals.medianMinutes > 10 ? "warn-text" : ""}>{fmt(data.totals.medianMinutes)}</strong><small>Target under 10 min{data.totals.within10 !== null ? ` · ${data.totals.within10}% on time` : ""}</small></div>
            <div className="ph-stat"><span>Rejected</span><strong>{data.totals.rejected}</strong><small>{data.totals.orders ? Math.round((data.totals.rejected / data.totals.orders) * 100) : 0}% of orders</small></div>
            <div className="ph-stat"><span>Re-upload asked</span><strong>{data.totals.reuploads}</strong><small>Unreadable or unclear</small></div>
          </section>

          <div className="dash-grid">
            <section className="flow-card">
              <div className="section-heading"><h2>Orders by store</h2><button className="text-button" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? "Only active stores" : "Show all 46"}</button></div>
              {stores.length === 0 ? <p className="empty-copy">No orders in this period.</p> : (
                <div className="dash-table">
                  <div className="dash-row dash-head"><span>Store</span><span>Orders</span><span>Waiting</span><span>Delivered</span><span>Rejected</span><span>Median check</span></div>
                  {stores.map((store) => (
                    <div className="dash-row" key={store.id}>
                      <span className="ph-strong">{store.name}</span>
                      <span className="bar-cell"><span className="bar" style={{ width: `${(store.total / busiest) * 100}%` }} /><b>{store.total}</b></span>
                      <span>{store.waiting}</span><span>{store.delivered}</span><span>{store.rejected}</span>
                      <span className={store.medianMinutes !== null && store.medianMinutes > 10 ? "warn-text" : ""}>{fmt(store.medianMinutes)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="flow-card">
              <h2>Why items get rejected</h2>
              {data.reasons.length === 0 ? <p className="empty-copy">No rejections in this period.</p> : (
                <ul className="reason-list">{data.reasons.map((reason) => <li key={reason.reason}><span>{reason.reason}</span><span className="bar-cell"><span className="bar muted" style={{ width: `${(reason.count / topReason) * 100}%` }} /><b>{reason.count}</b></span></li>)}</ul>
              )}
            </section>
          </div>
          <section className="flow-card reminder-job"><div><h2>Refill reminders</h2><p className="muted-small">Runs every morning. Texts customers whose medicine runs out within 5 days.</p>{reminder && <p className="ok-note">{reminder}</p>}</div><button className="secondary-button" type="button" onClick={runReminders}>Run now</button></section>
        </>}
      </div>
    </main>
  );
}
