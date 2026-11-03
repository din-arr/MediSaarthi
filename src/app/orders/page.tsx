"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "../../components/customer/PageShell";
import { useLanguage } from "../../components/LanguageProvider";
import { OrderStatusPill } from "../../components/customer/OrderTimeline";
type Order = { id: string; number: string; status: string; store: string; createdAt: string; familyMember: string; items: Array<unknown> };
export default function OrdersPage() { const { t } = useLanguage(); const [orders, setOrders] = useState<Order[] | null>(null); useEffect(() => { fetch("/api/orders").then((r) => r.json()).then(setOrders); }, []); return <PageShell title={t.dashboard.ordersTitle}><div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Order</th><th>For</th><th>Items</th><th>Status</th><th>Store</th><th>Date</th></tr></thead><tbody>{orders?.map((order) => <tr key={order.id}><td><Link href={`/orders/${order.id}`}>{order.number}</Link></td><td>{order.familyMember}</td><td>{order.items.length}</td><td><OrderStatusPill status={order.status} /></td><td>{order.store}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table><div className="order-list">{orders?.map((order) => <Link className="order-card order-card-link" href={`/orders/${order.id}`} key={order.id}><div className="order-list-heading"><strong>{order.number}</strong><OrderStatusPill status={order.status} /></div><span>{order.store} · {order.familyMember}</span><small>{new Date(order.createdAt).toLocaleDateString()}</small></Link>)}</div>{orders?.length === 0 && <p className="empty-copy">{t.dashboard.noOrders}</p>}{!orders && <HomeSkeleton />}</div></PageShell>; }
function HomeSkeleton() { return <div className="home-skeleton"><span /><span /></div>; }
