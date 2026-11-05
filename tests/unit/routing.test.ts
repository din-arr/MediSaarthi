import assert from "node:assert/strict";
import test from "node:test";
import { haversineKm, releaseStock, reserveStock, routeOrder, stockDate } from "../../src/lib/routing";

const productA = { productId: "a", quantity: 1, name: "Metformin" };
const productB = { productId: "b", quantity: 1, name: "Telmisartan" };

function fakePrisma(stores: Array<{ id: string; name: string; lat: number; lng: number; deliveryRadiusKm: number; stock: Array<{ productId: string; qty: number }> }>) {
  return { store: { findMany: async () => stores.map((store) => ({ ...store, stock: store.stock.map((stock) => ({ ...stock, date: new Date() })) })) } } as never;
}

test("nearest in-range store with all items wins", async () => {
  const result = await routeOrder(fakePrisma([
    { id: "far", name: "Far", lat: 22.65, lng: 88.42, deliveryRadiusKm: 8, stock: [{ productId: "a", qty: 2 }, { productId: "b", qty: 2 }] },
    { id: "near", name: "Near", lat: 22.587, lng: 88.417, deliveryRadiusKm: 8, stock: [{ productId: "a", qty: 2 }, { productId: "b", qty: 2 }] },
  ]), [productA, productB], 22.5867, 88.417);
  assert.equal(result.storeId, "near");
  assert.equal(result.partial, false);
});

test("partial fallback reports missing items", async () => {
  const result = await routeOrder(fakePrisma([
    { id: "near", name: "Near", lat: 22.587, lng: 88.417, deliveryRadiusKm: 8, stock: [{ productId: "a", qty: 2 }, { productId: "b", qty: 0 }] },
  ]), [productA, productB], 22.5867, 88.417);
  assert.equal(result.partial, true);
  assert.deepEqual(result.missing, ["Telmisartan"]);
});

test("out-of-range stores return a clear error", async () => {
  await assert.rejects(() => routeOrder(fakePrisma([{ id: "far", name: "Far", lat: 23, lng: 89, deliveryRadiusKm: 1, stock: [{ productId: "a", qty: 2 }] }]), [productA], 22.5867, 88.417), /No MediSaarthi store/);
});

test("concurrent reservations never make stock negative", async () => {
  let qty = 1;
  const transaction = { stock: { updateMany: async ({ where, data }: { where: { qty: { gte: number } }; data: { qty: { decrement: number } } }) => {
    if (qty < where.qty.gte) return { count: 0 };
    qty -= data.qty.decrement;
    return { count: 1 };
  } } } as never;
  const results = await Promise.allSettled([reserveStock(transaction, [productA], "store"), reserveStock(transaction, [productA], "store")]);
  assert.equal(qty, 0);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
});

test("stockDate is midnight UTC and haversine is symmetric", () => {
  assert.equal(stockDate(new Date("2026-11-05T18:30:00Z")).toISOString(), "2026-11-05T00:00:00.000Z");
  assert.ok(stockDate() instanceof Date);
  assert.equal(haversineKm(22.5, 88.3, 22.6, 88.4).toFixed(3), haversineKm(22.6, 88.4, 22.5, 88.3).toFixed(3));
});

test("prefers the store with more items in stock, then the closer one", async () => {
  const result = await routeOrder(fakePrisma([
    { id: "near-partial", name: "Near", lat: 22.587, lng: 88.417, deliveryRadiusKm: 8, stock: [{ productId: "a", qty: 2 }] },
    { id: "near-empty", name: "Empty", lat: 22.5868, lng: 88.417, deliveryRadiusKm: 8, stock: [] },
  ]), [productA, { productId: "b", quantity: 1 }], 22.5867, 88.417);
  assert.equal(result.storeId, "near-partial");
  assert.deepEqual(result.missing, ["b"]);
  assert.match(result.routingReason, /Partial stock/);
  assert.equal(result.options.length, 2);
});

test("full-stock reason mentions the item count", async () => {
  const result = await routeOrder(fakePrisma([{ id: "s", name: "S", lat: 22.587, lng: 88.417, deliveryRadiusKm: 8, stock: [{ productId: "a", qty: 5 }] }]), [productA], 22.5867, 88.417);
  assert.match(result.routingReason, /all 1 items/);
});

test("reserveStock throws when stock changed, releaseStock adds it back", async () => {
  const failing = { stock: { updateMany: async () => ({ count: 0 }) } } as never;
  await assert.rejects(() => reserveStock(failing, [productA], "store"), /Stock changed/);
  const calls: unknown[] = [];
  const releasing = { stock: { updateMany: async (args: unknown) => { calls.push(args); return { count: 1 }; } } } as never;
  await releaseStock(releasing, [productA, productB], "store");
  assert.equal(calls.length, 2);
});
