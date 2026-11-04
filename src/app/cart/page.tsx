"use client";

import { MapPin, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageShell from "../../components/customer/PageShell";
import AddressDialog, { type Address } from "../../components/customer/AddressDialog";
import { type CartItem, onCartChange, readCart, writeCart } from "../../lib/cart";
import { useLanguage } from "../../components/LanguageProvider";
import { fill } from "../../i18n/more";

export default function CartPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const m = t.more;
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [picker, setPicker] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [routing, setRouting] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const update = () => setItems(readCart());
    const first = window.setTimeout(update, 0);
    const stop = onCartChange(update);
    fetch("/api/addresses").then((response) => response.ok ? response.json() : []).then((list: Address[]) => { setAddresses(list); setAddressId(list.find((item) => item.isDefault)?.id ?? list[0]?.id ?? ""); });
    return () => { window.clearTimeout(first); stop(); };
  }, []);

  useEffect(() => {
    if (!addressId || !items.length) return;
    const timer = window.setTimeout(() => {
      fetch("/api/orders/routing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ addressId, items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) }) })
        .then((response) => response.json())
        .then((result: { storeName?: string; distanceKm?: number; error?: string }) => setRouting(result.storeName ? `${result.storeName} · ${result.distanceKm?.toFixed(1)} km · same day` : result.error ?? ""));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [addressId, items]);

  const change = (productId: string, delta: number) => writeCart(items.map((item) => item.productId === productId ? { ...item, quantity: Math.min(10, Math.max(1, item.quantity + delta)) } : item));
  const remove = (productId: string) => writeCart(items.filter((item) => item.productId !== productId));
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const address = addresses.find((item) => item.id === addressId);

  const place = async () => {
    if (!addressId) { setDialog(true); return; }
    setBusy(true); setError("");
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ addressId, items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setError(result.error); return; }
    writeCart([]);
    router.push(`/orders/${result.id}`);
  };

  return (
    <PageShell title={m.cartTitle} description={m.cartDesc}>
      {items.length === 0 ? (
        <div className="flow-card empty-state"><ShoppingBag size={32} /><strong>{m.cartEmpty}</strong><p>{m.cartEmptyHint}</p><Link className="auth-primary" href="/search">{t.dashboard.searchMedicines}</Link></div>
      ) : (
        <div className="order-detail-layout">
          <section className="flow-card order-detail-card">
            <h2>{fill(m.itemCount, { n: items.length })}</h2>
            {items.map((item) => (
              <div className="order-item-row" key={item.productId}>
                <div className="order-item-copy"><strong>{item.name} {item.strength}</strong><small className="muted-small">{item.packSize} · ₹{item.price}</small></div>
                <div className="cart-controls">
                  <div className="stepper"><button type="button" aria-label="Less" onClick={() => change(item.productId, -1)}><Minus size={15} /></button><span>{item.quantity}</span><button type="button" aria-label="More" onClick={() => change(item.productId, 1)}><Plus size={15} /></button></div>
                  <strong className="cart-line">₹{item.price * item.quantity}</strong>
                  <button className="icon-button" type="button" aria-label={`Remove ${item.name}`} onClick={() => remove(item.productId)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            <Link className="text-button" href="/search">{m.addMore}</Link>
          </section>

          <aside className="order-side">
            <section className="flow-card side-card">
              <h3><MapPin size={18} />{t.dashboard.deliverTo}</h3>
              {address ? <><strong>{address.label}</strong><span className="muted-small">{address.line1}, {address.area} {address.pincode}</span></> : <span className="muted-small">{m.noAddress}</span>}
              <button className="text-button" type="button" onClick={() => addresses.length ? setPicker(!picker) : setDialog(true)}>{addresses.length ? m.change : m.addAddress}</button>
              {picker && <div className="address-picker">{addresses.map((item) => <label key={item.id}><input type="radio" checked={item.id === addressId} onChange={() => { setAddressId(item.id); setPicker(false); }} />{item.label} · {item.area} · {item.pincode}</label>)}<button className="text-button" type="button" onClick={() => { setPicker(false); setDialog(true); }}>{m.addNew}</button></div>}
              {routing && <p className="routing-preview">{fill(m.from, { store: routing })}</p>}
            </section>
            <section className="flow-card side-card">
              <h3>{m.total}</h3>
              <strong className="cart-total">₹{total}</strong>
              <span className="muted-small">{m.cartNote}</span>
              {error && <p className="form-error">{error}</p>}
              <button className="auth-primary" type="button" disabled={busy} onClick={place}>{busy ? m.placing : addressId ? m.placeOrder : m.addAddressFirst}</button>
            </section>
          </aside>
        </div>
      )}
      <AddressDialog open={dialog} onClose={() => setDialog(false)} onSaved={(saved) => { setAddresses((current) => [saved, ...current.filter((item) => item.id !== saved.id)]); setAddressId(saved.id); }} />
    </PageShell>
  );
}
