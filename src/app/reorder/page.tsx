"use client";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "../../components/customer/PageShell";
import { useLanguage } from "../../components/LanguageProvider";
type Order = { id: string; items: Array<{ name: string; quantity: number; productId?: string }> };
export default function ReorderPage() {
  const { t } = useLanguage(); const router = useRouter(); const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/orders").then((r) => r.json()).then((items: Order[]) => setOrder(items[0] ?? null)); }, []);
  const submit = async () => { if (!order) return; const response = await fetch(`/api/orders/${order.id}/reorder`, { method: "POST" }); const result = await response.json() as { id?: string; error?: string }; if (!response.ok) setError(result.error ?? t.auth.loginError); else router.push(`/orders/${result.id}`); };
  return <PageShell title={t.dashboard.reorderTitle}><div className="flow-card">{!order ? <><p className="empty-copy">{t.dashboard.noPreviousOrder}</p><Link className="primary-button" href="/upload">{t.dashboard.uploadFirst}</Link></> : <><p className="muted-copy">{t.dashboard.reorderSubtitle.replace("{count}", String(order.items.length)).replace("{date}", "")}</p>{order.items.map((item, index) => <div className="stepper-row" key={item.name}><strong>{item.name}</strong><div><button type="button" onClick={() => setOrder({ ...order, items: order.items.map((current, position) => position === index ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current) })}><Minus size={16} /></button><span>{item.quantity}</span><button type="button" onClick={() => setOrder({ ...order, items: order.items.map((current, position) => position === index ? { ...current, quantity: current.quantity + 1 } : current) })}><Plus size={16} /></button></div></div>)}{error && <p className="form-error">{error}</p>}<button className="auth-primary" type="button" onClick={submit}>{t.dashboard.placeOrder}</button><Link className="text-button" href="/upload">{t.dashboard.uploadPrescription}</Link></>}</div></PageShell>;
}
