"use client";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onCartChange, readCart } from "../../lib/cart";

export default function CartButton() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    const first = window.setTimeout(update, 0);
    const stop = onCartChange(update);
    return () => { window.clearTimeout(first); stop(); };
  }, []);
  return <Link className="icon-button bell" href="/cart" aria-label={`Cart${count ? `, ${count} items` : ""}`}><ShoppingBag size={18} />{count > 0 && <span className="bell-dot">{count}</span>}</Link>;
}
