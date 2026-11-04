"use client";

import { Check, FileUp, Plus, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageShell from "../../components/customer/PageShell";
import { useLanguage } from "../../components/LanguageProvider";
import { addToCart } from "../../lib/cart";

type Product = { id: string; name: string; strength: string; packSize: string; schedule: string; price: string | number };

export default function SearchPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => fetch(`/api/search?q=${encodeURIComponent(query)}`).then((response) => response.json()).then(setProducts), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const add = (product: Product) => {
    addToCart({ productId: product.id, name: product.name, strength: product.strength, packSize: product.packSize, price: Number(product.price) });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1200);
  };

  return (
    <PageShell title={t.dashboard.searchTitle} description={t.more.searchDesc} action={<Link className="secondary-button" href="/cart">{t.more.viewCart}</Link>}>
      <div className="search-box"><SearchIcon size={20} /><input value={query} autoFocus onChange={(event) => setQuery(event.target.value)} placeholder={t.dashboard.searchPlaceholder} /></div>
      <div className="product-results">
        {products.map((product) => {
          const otc = product.schedule === "OTC";
          return (
            <article className="product-result" key={product.id}>
              <div>
                <strong>{product.name} {product.strength}</strong>
                <p>{product.packSize} · ₹{Number(product.price)} <span className={`schedule-badge schedule-${product.schedule}`}>{otc ? t.more.noRxNeeded : product.schedule === "X" ? t.more.notOnline : `Schedule ${product.schedule}`}</span></p>
              </div>
              {product.schedule === "X" ? <span className="muted-small">{t.more.askStore}</span>
                : otc ? <button className={`secondary-button add-btn ${added === product.id ? "done" : ""}`} type="button" onClick={() => add(product)}>{added === product.id ? <><Check size={16} /> {t.more.added}</> : <><Plus size={16} /> {t.more.addToCart}</>}</button>
                : <Link className="text-button" href="/upload"><FileUp size={16} /> {t.more.needsRx}</Link>}
            </article>
          );
        })}
        {products.length === 0 && <p className="empty-copy">{t.dashboard.noResults}</p>}
      </div>
    </PageShell>
  );
}
