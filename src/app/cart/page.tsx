"use client";

import { MapPin, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageShell from "../../components/customer/PageShell";
import AddressDialog, { type Address } from "../../components/customer/AddressDialog";
import { type CartItem, onCartChange, readCart, writeCart } from "../../lib/cart";

export default function CartPage() {
  const router = useRouter();
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
    <PageShell title="Your cart" description="Medicines that don't need a prescription. Pay after you place the order.">
      {items.length === 0 ? (
        <div className="flow-card empty-state"><ShoppingBag size={32} /><strong>Your cart is empty</strong><p>Add things like paracetamol, ORS or vitamins from search.</p><Link className="auth-primary" href="/search">Search medicines</Link></div>
      ) : (
        <div className="order-detail-layout">
          <section className="flow-card order-detail-card">
            <h2>{items.length} item{items.length === 1 ? "" : "s"}</h2>
            {items.map((item) => (
              <div className="order-item-row" key={item.productId}>
                <div className="order-item-copy"><strong>{item.name} {item.strength}</strong><small className="muted-small">{item.packSize} · ₹{item.price} each</small></div>
                <div className="cart-controls">
                  <div className="stepper"><button type="button" aria-label="Less" onClick={() => change(item.productId, -1)}><Minus size={15} /></button><span>{item.quantity}</span><button type="button" aria-label="More" onClick={() => change(item.productId, 1)}><Plus size={15} /></button></div>
                  <strong className="cart-line">₹{item.price * item.quantity}</strong>
                  <button className="icon-button" type="button" aria-label={`Remove ${item.name}`} onClick={() => remove(item.productId)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            <Link className="text-button" href="/search">+ Add more</Link>
          </section>

          <aside className="order-side">
            <section className="flow-card side-card">
              <h3><MapPin size={18} />Deliver to</h3>
              {address ? <><strong>{address.label}</strong><span className="muted-small">{address.line1}, {address.area} {address.pincode}</span></> : <span className="muted-small">No address yet.</span>}
              <button className="text-button" type="button" onClick={() => addresses.length ? setPicker(!picker) : setDialog(true)}>{addresses.length ? "Change" : "+ Add delivery address"}</button>
              {picker && <div className="address-picker">{addresses.map((item) => <label key={item.id}><input type="radio" checked={item.id === addressId} onChange={() => { setAddressId(item.id); setPicker(false); }} />{item.label} · {item.area} · {item.pincode}</label>)}<button className="text-button" type="button" onClick={() => { setPicker(false); setDialog(true); }}>+ Add new</button></div>}
              {routing && <p className="routing-preview">From {routing}</p>}
            </section>
            <section className="flow-card side-card">
              <h3>Total</h3>
              <strong className="cart-total">₹{total}</strong>
              <span className="muted-small">No prescription needed, so no pharmacist wait. You pay by UPI or cash on delivery on the next screen.</span>
              {error && <p className="form-error">{error}</p>}
              <button className="auth-primary" type="button" disabled={busy} onClick={place}>{busy ? "Placing…" : addressId ? "Place order" : "Add address to continue"}</button>
            </section>
          </aside>
        </div>
      )}
      <AddressDialog open={dialog} onClose={() => setDialog(false)} onSaved={(saved) => { setAddresses((current) => [saved, ...current.filter((item) => item.id !== saved.id)]); setAddressId(saved.id); }} />
    </PageShell>
  );
}
