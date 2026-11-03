"use client";

import { Clock3, FileText, HelpCircle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import PageShell from "../../../components/customer/PageShell";
import OrderTimeline, { OrderStatusPill } from "../../../components/customer/OrderTimeline";
import { useLanguage } from "../../../components/LanguageProvider";

type Order = { id: string; number: string; status: string; store: string; distanceKm: number | null; routingReason: string | null; missingItems: string[] | null; createdAt: string; familyMember: string; items: Array<{ name: string; quantity: number; schedule: string }> };

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { params.then(({ id }) => fetch("/api/orders").then((r) => r.json()).then((items: Order[]) => setOrder(items.find((item) => item.id === id) ?? null))); }, [params]);
  return <PageShell title={order?.number ?? t.dashboard.ordersTitle} description={order ? `${new Date(order.createdAt).toLocaleDateString()} · For: ${order.familyMember}` : undefined}>
    {order ? <div className="order-detail-layout"><section className="flow-card order-detail-card"><div className="order-detail-header"><div><p className="eyebrow">{t.dashboard.orderId}</p><h2>{order.number}</h2></div><OrderStatusPill status={order.status} /></div><div className="detail-section"><h3>{t.dashboard.items}</h3>{order.items.map((item) => <div className="order-item-row" key={item.name}><div><strong>{item.name}</strong><div><span className={`schedule-badge schedule-${item.schedule}`}>{item.schedule === "H" ? "Schedule H" : item.schedule === "H1" ? "Schedule H1" : item.schedule}</span>{(item.schedule === "H" || item.schedule === "H1") && <small>{t.dashboard.needsApproval}</small>}</div></div><strong>× {item.quantity}</strong></div>)}</div>{order.missingItems && order.missingItems.length > 0 && <div className="missing-items"><strong>{t.dashboard.missingItems}</strong><p>{order.missingItems.join(", ")}</p></div>}<div className="detail-section"><h3><MapPin size={19} />{t.dashboard.store}</h3><div className="store-card"><strong>{order.status === "PACKED" ? `${t.dashboard.packedAt} ${order.store}` : `${t.dashboard.assignedTo} ${order.store}`}</strong><span>{order.distanceKm?.toFixed(1)} km · {t.dashboard.sameDay}</span><p>{order.routingReason}</p></div></div><div className="detail-section"><h3><FileText size={19} />{t.dashboard.prescription}</h3><div className="prescription-thumb"><FileText size={24} /><span>{t.dashboard.viewPrescription}</span></div></div><div className="detail-section"><h3><Clock3 size={19} />{t.dashboard.orderStatus}</h3><OrderTimeline status={order.status} /></div><a className="help-link" href="mailto:care@medisaarthi.demo"><HelpCircle size={18} />{t.dashboard.needHelp}</a></section></div> : <div className="home-skeleton"><span /><span /></div>}
  </PageShell>;
}
