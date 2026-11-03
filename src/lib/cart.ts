"use client";

/** Tiny cart kept in the browser (OTC medicines only). */
export type CartItem = { productId: string; name: string; strength: string; packSize: string; price: number; quantity: number };

const KEY = "medisaarthi-cart";
const EVENT = "cart-changed";

export function readCart(): CartItem[] {
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as CartItem[]; } catch { return []; }
}

export function writeCart(items: CartItem[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage blocked: cart lives for this page only */ }
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const items = readCart();
  const existing = items.find((entry) => entry.productId === item.productId);
  writeCart(existing ? items.map((entry) => entry.productId === item.productId ? { ...entry, quantity: Math.min(10, entry.quantity + 1) } : entry) : [...items, { ...item, quantity: 1 }]);
}

export function onCartChange(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
}
