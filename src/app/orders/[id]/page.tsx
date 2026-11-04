"use client";

import { AlertTriangle, Clock3, FileText, HelpCircle, MapPin, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageShell from "../../../components/customer/PageShell";
import OrderTimeline, { OrderStatusPill } from "../../../components/customer/OrderTimeline";
import { useLanguage } from "../../../components/LanguageProvider";
import UpiDialog from "../../../components/customer/UpiDialog";
import { fill } from "../../../i18n/more";

type Item = { id: string; consentStatus: string; price: number; suggestion: { name: string; price: number } | null; name: string; quantity: number; originalQty: number | null; approvalStatus: string; rejectReason: string | null; schedule: string };
type Order = { id: string; number: string; status: string; store: string; distanceKm: number | null; routingReason: string | null; missingItems: string[] | null; createdAt: string; familyMember: string; decisionReason: string | null; total: number; paymentMethod: string | null; paymentStatus: string; paymentRef: string | null; invoiceNumber: string | null; riderName: string | null; items: Item[] };

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<"UPI" | "COD" | null>(null);
  const [upiOpen, setUpiOpen] = useState(false);

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

  const pay = async (method: "UPI" | "COD", extra: { upiId?: string; outcome?: "success" | "failure" } = {}) => {
    if (!order) return "Order not loaded.";
    setPaying(method); setError("");
    const response = await fetch(`/api/orders/${order.id}/pay`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method, ...extra }) });
    const result = await response.json();
    setPaying(null);
    if (!response.ok) { if (method === "COD") setError(result.error); return result.error as string; }
    await load();
    return null;
  };

  const consent = async (itemId: string, accept: boolean) => {
    if (!order) return;
    const response = await fetch(`/api/orders/${order.id}/items/${itemId}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accept }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    await load();
  };

  const isRx = (schedule: string) => schedule === "H" || schedule === "H1";
  const waiting = order?.status === "AWAITING_PHARMACIST";

  return <PageShell title={order?.number ?? t.dashboard.ordersTitle} description={order ? `${new Date(order.createdAt).toLocaleDateString()} · For: ${order.familyMember}` : undefined}>
    {order ? <div className="order-detail-layout">
      <section className="flow-card order-detail-card">
        <div className="order-detail-header"><div><p className="eyebrow">{t.dashboard.orderId}</p><h2>{order.number}</h2></div><OrderStatusPill status={order.status} /></div>
        <OrderTimeline status={order.status} />
        {waiting && <p className="muted-small timeline-note">{t.more.usuallyTen}</p>}

        {order.status === "REUPLOAD_REQUESTED" && <div className="reupload-box">
          <div className="reupload-head"><AlertTriangle size={20} /><div><strong>{t.more.needClearer}</strong><p>{order.decisionReason ?? t.more.uploadAgain}</p></div></div>
          <label className="reupload-pick"><Upload size={18} /><span>{file ? file.name : t.more.chooseNew}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="auth-primary" type="button" disabled={!file || sending} onClick={reupload}>{sending ? t.more.sending : t.more.sendToPharmacist}</button>
        </div>}
        {order.status === "REJECTED" && order.decisionReason && <div className="missing-items"><strong>{t.more.whyRejected}</strong><p>{order.decisionReason}</p></div>}

        <div className="detail-section"><h3>{t.dashboard.items} <span className="muted-small">({order.items.length})</span></h3>{order.items.map((item) => <div className={`order-item-row ${item.approvalStatus === "REJECTED" ? "item-rejected" : ""}`} key={item.name}>
          <div className="order-item-copy"><strong>{item.name}</strong><div className="order-item-tags">
            <span className={`schedule-badge schedule-${item.schedule}`}>{isRx(item.schedule) ? `Schedule ${item.schedule}` : item.schedule}</span>
            {item.approvalStatus === "PENDING" && isRx(item.schedule) && <small>{t.dashboard.needsApproval}</small>}
            {(item.approvalStatus === "APPROVED" || item.approvalStatus === "EDITED") && <small className="ok-note">{t.more.checked}</small>}
            {item.approvalStatus === "EDITED" && item.originalQty && <small>{fill(t.more.qtyChanged, { from: item.originalQty, to: item.quantity })}</small>}
            {item.approvalStatus === "REJECTED" && <small className="ph-reject-note">{fill(t.more.notIncluded, { reason: item.rejectReason ?? "" })}</small>}
            {item.consentStatus === "ACCEPTED" && <small className="ok-note">{t.more.genericAgreed}</small>}
          </div>
          {item.suggestion && <div className="generic-card">
            <p><strong>{t.more.genericTitle}</strong><br />{fill(t.more.genericBody, { name: item.suggestion.name, price: item.suggestion.price, old: item.price, save: (item.price - item.suggestion.price) * item.quantity })}</p>
            <div className="generic-actions"><button className="auth-primary" type="button" onClick={() => consent(item.id, true)}>{t.more.switchGeneric}</button><button className="secondary-button" type="button" onClick={() => consent(item.id, false)}>{fill(t.more.keep, { name: item.name.split(" ")[0] })}</button></div>
          </div>}</div><span className="qty-chip">× {item.quantity}</span></div>)}</div>
        {order.missingItems && order.missingItems.length > 0 && <div className="missing-items"><strong>{t.dashboard.missingItems}</strong><p>{order.missingItems.join(", ")}</p></div>}
      </section>

      <aside className="order-side">
        <section className="flow-card side-card"><h3><MapPin size={18} />{t.dashboard.store}</h3><strong>{order.store || t.more.beingAssigned}</strong>{order.distanceKm != null && <span className="muted-small">{fill(t.more.kmAway, { km: order.distanceKm.toFixed(1) })} · {t.dashboard.sameDay}</span>}{order.routingReason && <p className="muted-small">{order.routingReason}</p>}</section>
        <section className="flow-card side-card"><h3><FileText size={18} />{t.dashboard.prescription}</h3><p className="muted-small">{t.more.rxStored}</p></section>
        <section className={`flow-card side-card ${order.status === "APPROVED" && order.paymentStatus === "UNPAID" ? "pay-due" : ""}`}><h3><Clock3 size={18} />{t.more.payment} · ₹{order.total}</h3>
          {order.paymentStatus === "PAID" ? <p><strong className="ok-note">{t.more.paidUpi}</strong><br /><span className="muted-small">Ref {order.paymentRef} · test mode</span></p>
          : order.paymentStatus === "COD_PENDING" ? <p><strong>{t.more.cod}</strong><br /><span className="muted-small">{fill(t.more.codPay, { amount: order.total })}</span></p>
          : order.status === "APPROVED" ? <><p className="muted-small">{t.more.howPay}</p><div className="pay-buttons"><button className="auth-primary" type="button" disabled={paying !== null} onClick={() => setUpiOpen(true)}>{t.more.payUpi}</button><button className="secondary-button" type="button" disabled={paying !== null} onClick={() => pay("COD")}>{t.more.cod}</button></div><small className="muted-small">{t.more.testMode}</small></>
          : <p className="muted-small">{t.more.payAfter}</p>}
          {order.invoiceNumber && <span className="muted-small">{fill(t.more.invoice, { no: order.invoiceNumber })}</span>}
          {order.riderName && <span className="muted-small">{fill(t.more.rider, { name: order.riderName })}</span>}
        </section>
        <a className="flow-card side-card help-link" href={`mailto:support@medisaarthi.demo?subject=Help with order ${order.number}`}><HelpCircle size={18} />{t.dashboard.needHelp}</a>
      </aside>
      <UpiDialog open={upiOpen} amount={order.total} orderNumber={order.number} onClose={() => setUpiOpen(false)} onPay={(body) => pay("UPI", body)} />
    </div> : <div className="home-skeleton"><span /><span /></div>}
  </PageShell>;
}
