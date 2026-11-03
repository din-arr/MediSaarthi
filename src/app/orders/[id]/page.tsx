"use client";

import { AlertTriangle, Clock3, FileText, HelpCircle, MapPin, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageShell from "../../../components/customer/PageShell";
import OrderTimeline, { OrderStatusPill } from "../../../components/customer/OrderTimeline";
import { useLanguage } from "../../../components/LanguageProvider";

type Item = { name: string; quantity: number; originalQty: number | null; approvalStatus: string; rejectReason: string | null; schedule: string };
type Order = { id: string; number: string; status: string; store: string; distanceKm: number | null; routingReason: string | null; missingItems: string[] | null; createdAt: string; familyMember: string; decisionReason: string | null; items: Item[] };

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { id } = await params;
    const items = await fetch("/api/orders").then((response) => response.json()) as Order[];
    setOrder(items.find((item) => item.id === id) ?? null);
  }, [params]);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  const reupload = async () => {
    if (!order || !file) return;
    setSending(true); setError("");
    const form = new FormData(); form.append("file", file);
    const response = await fetch(`/api/orders/${order.id}/reupload`, { method: "POST", body: form });
    const result = await response.json();
    setSending(false);
    if (!response.ok) { setError(result.error); return; }
    setFile(null); await load();
  };

  const isRx = (schedule: string) => schedule === "H" || schedule === "H1";
  const waiting = order?.status === "AWAITING_PHARMACIST";

  return <PageShell title={order?.number ?? t.dashboard.ordersTitle} description={order ? `${new Date(order.createdAt).toLocaleDateString()} · For: ${order.familyMember}` : undefined}>
    {order ? <div className="order-detail-layout">
      <section className="flow-card order-detail-card">
        <div className="order-detail-header"><div><p className="eyebrow">{t.dashboard.orderId}</p><h2>{order.number}</h2></div><OrderStatusPill status={order.status} /></div>
        <OrderTimeline status={order.status} />
        {waiting && <p className="muted-small timeline-note">A pharmacist usually checks orders within 10 minutes.</p>}

        {order.status === "REUPLOAD_REQUESTED" && <div className="reupload-box">
          <div className="reupload-head"><AlertTriangle size={20} /><div><strong>The pharmacist needs a clearer prescription</strong><p>{order.decisionReason ?? "Please upload the prescription again."}</p></div></div>
          <label className="reupload-pick"><Upload size={18} /><span>{file ? file.name : "Choose a new photo or PDF"}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="auth-primary" type="button" disabled={!file || sending} onClick={reupload}>{sending ? "Sending…" : "Send to pharmacist"}</button>
        </div>}
        {order.status === "REJECTED" && order.decisionReason && <div className="missing-items"><strong>Why this order was rejected</strong><p>{order.decisionReason}</p></div>}

        <div className="detail-section"><h3>{t.dashboard.items} <span className="muted-small">({order.items.length})</span></h3>{order.items.map((item) => <div className={`order-item-row ${item.approvalStatus === "REJECTED" ? "item-rejected" : ""}`} key={item.name}>
          <div className="order-item-copy"><strong>{item.name}</strong><div className="order-item-tags">
            <span className={`schedule-badge schedule-${item.schedule}`}>{isRx(item.schedule) ? `Schedule ${item.schedule}` : item.schedule}</span>
            {item.approvalStatus === "PENDING" && isRx(item.schedule) && <small>{t.dashboard.needsApproval}</small>}
            {(item.approvalStatus === "APPROVED" || item.approvalStatus === "EDITED") && <small className="ok-note">Checked by pharmacist</small>}
            {item.approvalStatus === "EDITED" && item.originalQty && <small>Quantity changed from {item.originalQty} to {item.quantity}</small>}
            {item.approvalStatus === "REJECTED" && <small className="ph-reject-note">Not included: {item.rejectReason}</small>}
          </div></div><span className="qty-chip">× {item.quantity}</span></div>)}</div>
        {order.missingItems && order.missingItems.length > 0 && <div className="missing-items"><strong>{t.dashboard.missingItems}</strong><p>{order.missingItems.join(", ")}</p></div>}
      </section>

      <aside className="order-side">
        <section className="flow-card side-card"><h3><MapPin size={18} />{t.dashboard.store}</h3><strong>{order.store || "Being assigned"}</strong>{order.distanceKm != null && <span className="muted-small">{order.distanceKm.toFixed(1)} km away · {t.dashboard.sameDay}</span>}{order.routingReason && <p className="muted-small">{order.routingReason}</p>}</section>
        <section className="flow-card side-card"><h3><FileText size={18} />{t.dashboard.prescription}</h3><p className="muted-small">Stored encrypted. Only pharmacists can open it, and every view is logged.</p></section>
        <section className="flow-card side-card"><h3><Clock3 size={18} />Payment</h3><p className="muted-small">You pay after the pharmacist approves: UPI or cash on delivery (test mode).</p></section>
        <a className="flow-card side-card help-link" href={`mailto:support@medisaarthi.demo?subject=Help with order ${order.number}`}><HelpCircle size={18} />{t.dashboard.needHelp}</a>
      </aside>
    </div> : <div className="home-skeleton"><span /><span /></div>}
  </PageShell>;
}
