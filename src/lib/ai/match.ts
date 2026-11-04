/** Pure matching logic, kept separate so it can be tested without a database. */
export type Product = { id: string; name: string; strength: string; schedule: string };
export type Read = { name?: string; strength?: string; quantity?: number; confidence?: number };

const clean = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Finds the closest catalogue product for what the AI read (name first, then strength). */
export function matchProduct(read: Read, products: Product[]) {
  // Doctors write "Tab", "Cap", "Syp" etc. before the name.
  const name = clean((read.name ?? "").replace(/^\s*(tab|tabs|tablet|cap|caps|capsule|syp|syrup|inj|t\.|c\.)\.?\s+/i, ""));
  if (name.length < 3) return null;
  const candidates = products.filter((product) => { const p = clean(product.name); return p === name || p.startsWith(name) || name.startsWith(p); });
  if (!candidates.length) return null;
  // Compare the number part so "500", "500mg" and "500 mg" all match.
  const number = (value = "") => value.match(/\d+(\.\d+)?/)?.[0] ?? "";
  const strength = number(read.strength);
  return candidates.find((product) => strength && number(product.strength) === strength) ?? candidates[0];
}

