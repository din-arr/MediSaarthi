"use client";

import type { Role } from "../../../lib/session";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import PharmacistHeader from "../../../components/pharmacist/PharmacistHeader";
import { useStaffText } from "../../../components/pharmacist/useStaffText";

type StoreRow = { id: string; name: string; total: number; waiting: number; inProgress: number; delivered: number; rejected: number; medianMinutes: number | null };
type Data = { days: number; totals: { orders: number; waiting: number; delivered: number; rejected: number; reuploads: number; medianMinutes: number | null; within10: number | null; unsafeDispatches: number }; unsafe: string[]; reasons: Array<{ reason: string; count: number }>; byStore: StoreRow[] };


export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [reminder, setReminder] = useState("");
  const s = useStaffText();
  const fmt = (value: number | null) => value === null ? "–" : s("{n} min", { n: Math.round(value) });
  const runReminders = async () => { const response = await fetch("/api/pharmacist/reminders", { method: "POST" }); const result = await response.json(); setReminder(response.ok ? s("Checked {c} refills, sent {r} reminders.", { c: result.checked, r: result.sent }) : result.error); };
  const [me, setMe] = useState<{ name: string; role?: Role; user?: { registrationNumber?: string | null } } | null>(null);

  useEffect(() => { fetch("/api/auth/session").then((response) => response.ok ? response.json() : null).then(setMe); }, []);
  useEffect(() => { fetch(`/api/pharmacist/dashboard?days=${days}`).then((response) => response.ok ? response.json() : null).then(setData); }, [days]);

  const stores = data ? (showAll ? data.byStore : data.byStore.filter((store) => store.total > 0)) : [];
  const busiest = Math.max(1, ...(data?.byStore.map((store) => store.total) ?? [1]));
  const topReason = Math.max(1, ...(data?.reasons.map((reason) => reason.count) ?? [1]));

  return (
    <main className="customer-home">
      <PharmacistHeader name={me?.name} regNo={me?.user?.registrationNumber} role={me?.role} />
      <div className="customer-content page-content">
        <div className="page-heading">
          <div><h1>{s("All stores")}</h1><p>{s("Orders, verification time and rejections across Kolkata and Howrah.")}</p></div>
          <div className="seg">{[1, 7, 30].map((value) => <button key={value} type="button" className={days === value ? "on" : ""} onClick={() => setDays(value)}>{value === 1 ? s("Today") : s("{n} days", { n: value })}</button>)}</div>
        </div>

        {!data ? <div className="home-skeleton"><span /><span /><span /></div> : <>
          <div className={`safety-banner ${data.totals.unsafeDispatches ? "bad" : "good"}`}>
            {data.totals.unsafeDispatches ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
            <div>
              <strong>{data.totals.unsafeDispatches ? s("{n} order(s) left a store with an unapproved Schedule H item", { n: data.totals.unsafeDispatches }) : s("No Schedule H or H1 item dispatched without approval")}</strong>
              <p>{data.totals.unsafeDispatches ? s("Check {list} now.", { list: data.unsafe.join(", ") }) : s("Every prescription medicine that left a store was approved by a registered pharmacist.")}</p>
            </div>
          </div>

          <section className="ph-stats">
            <div className="ph-stat"><span>{s("Orders")}</span><strong>{data.totals.orders}</strong><small>{s("{d} delivered · {w} waiting", { d: data.totals.delivered, w: data.totals.waiting })}</small></div>
            <div className="ph-stat"><span>{s("Median verification")}</span><strong className={data.totals.medianMinutes !== null && data.totals.medianMinutes > 10 ? "warn-text" : ""}>{fmt(data.totals.medianMinutes)}</strong><small>{s("Target under 10 min")}{data.totals.within10 !== null ? ` · ${s("{p}% on time", { p: data.totals.within10 })}` : ""}</small></div>
            <div className="ph-stat"><span>{s("Rejected")}</span><strong>{data.totals.rejected}</strong><small>{s("{p}% of orders", { p: data.totals.orders ? Math.round((data.totals.rejected / data.totals.orders) * 100) : 0 })}</small></div>
            <div className="ph-stat"><span>{s("Re-upload asked")}</span><strong>{data.totals.reuploads}</strong><small>{s("Unreadable or unclear")}</small></div>
          </section>

          <div className="dash-grid">
            <section className="flow-card">
              <div className="section-heading"><h2>{s("Orders by store")}</h2><button className="text-button" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? s("Only active stores") : s("Show all 46")}</button></div>
              {stores.length === 0 ? <p className="empty-copy">{s("No orders in this period.")}</p> : (
                <div className="dash-table">
                  <div className="dash-row dash-head"><span>{s("Store")}</span><span>{s("Orders")}</span><span>{s("Waiting")}</span><span>{s("Delivered")}</span><span>{s("Rejected")}</span><span>{s("Median check")}</span></div>
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
              <h2>{s("Why items get rejected")}</h2>
              {data.reasons.length === 0 ? <p className="empty-copy">{s("No rejections in this period.")}</p> : (
                <ul className="reason-list">{data.reasons.map((reason) => <li key={reason.reason}><span>{s(reason.reason)}</span><span className="bar-cell"><span className="bar muted" style={{ width: `${(reason.count / topReason) * 100}%` }} /><b>{reason.count}</b></span></li>)}</ul>
              )}
            </section>
          </div>
          <section className="flow-card reminder-job"><div><h2>{s("Refill reminders")}</h2><p className="muted-small">{s("Runs every morning. Texts customers whose medicine runs out within 5 days.")}</p>{reminder && <p className="ok-note">{reminder}</p>}</div><button className="secondary-button" type="button" onClick={runReminders}>{s("Run now")}</button></section>
          <section className="flow-card reminder-job"><div><h2>{s("Schedule H1 register")}</h2><p className="muted-small">{s("Every H1 sale with patient, prescriber and dispensing pharmacist. Last 90 days.")}</p></div><a className="secondary-button" href="/api/pharmacist/h1-register?days=90" download>{s("Download CSV")}</a></section>
        </>}
      </div>
    </main>
  );
}
