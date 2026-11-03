"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "../../components/customer/PageShell";
import { useLanguage } from "../../components/LanguageProvider";
import { OrderStatusPill } from "../../components/customer/OrderTimeline";
type Order = { id: string; number: string; status: string; store: string; createdAt: string; familyMember: string };
export default function OrdersPage() { const { t } = useLanguage(); const [orders, setOrders] = useState<Order[] | null>(null); useEffect(() => { fetch("/api/orders").then((r) => r.json()).then(setOrders); }, []); return <PageShell title={t.dashboard.ordersTitle}><div className="order-list">{orders?.map((order) => <Link className="order-card order-card-link" href={`/orders/${order.id}`} key={order.id}><div className="order-list-heading"><strong>{order.number}</strong><OrderStatusPill status={order.status} /></div><span>{order.store} · {order.familyMember}</span><small>{new Date(order.createdAt).toLocaleDateString()}</small></Link>) ?? <HomeSkeleton />}{orders?.length === 0 && <p className="empty-copy">{t.dashboard.noOrders}</p>}</div></PageShell>; }
function HomeSkeleton() { return <div className="home-skeleton"><span /><span /></div>; }
