"use client";
import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import PageShell from "../../components/customer/PageShell";
import { useLanguage } from "../../components/LanguageProvider";
type Product = { id: string; name: string; strength: string; packSize: string; schedule: string };
export default function SearchPage() { const { t } = useLanguage(); const [query, setQuery] = useState(""); const [products, setProducts] = useState<Product[]>([]); useEffect(() => { const timer = setTimeout(() => fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()).then(setProducts), 250); return () => clearTimeout(timer); }, [query]); return <PageShell title={t.dashboard.searchTitle}><div className="search-box"><SearchIcon size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.dashboard.searchPlaceholder} /></div><div className="product-results">{products.map((product) => <article className="product-result" key={product.id}><div><strong>{product.name} {product.strength}</strong><p>{product.packSize} <span className={`schedule-badge schedule-${product.schedule}`}>{product.schedule}</span></p></div><Link href="/upload" className="text-button">{t.dashboard.addToOrder}</Link></article>)}{products.length === 0 && <p className="empty-copy">{t.dashboard.noResults}</p>}</div></PageShell>; }
