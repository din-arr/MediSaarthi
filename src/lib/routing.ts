import { Prisma, PrismaClient } from "@prisma/client";

export type RoutingItem = { productId: string; quantity: number; name?: string };
export type RoutingOption = { storeId: string; storeName: string; distanceKm: number; available: string[]; missing: string[]; allInStock: boolean };
export type RoutingResult = { storeId: string; distanceKm: number; routingReason: string; missing: string[]; available: string[]; partial: boolean; options: RoutingOption[] };

export function stockDate(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function haversineKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const radius = 6371;
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(toLat - fromLat);
  const dLng = radians(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function routeOrder(prisma: PrismaClient | Prisma.TransactionClient, items: RoutingItem[], deliveryLat: number, deliveryLng: number, date = new Date()): Promise<RoutingResult> {
  const stores = await prisma.store.findMany({ include: { stock: { where: { date: stockDate(date), productId: { in: items.map((item) => item.productId) } } } } });
  const options = stores
    .map((store) => {
      const distanceKm = haversineKm(deliveryLat, deliveryLng, store.lat, store.lng);
      const inRange = distanceKm <= store.deliveryRadiusKm;
      const available = items.filter((item) => (store.stock.find((stock) => stock.productId === item.productId)?.qty ?? 0) >= item.quantity).map((item) => item.productId);
      const missing = items.filter((item) => !available.includes(item.productId)).map((item) => item.name ?? item.productId);
      return { storeId: store.id, storeName: store.name, distanceKm, available, missing, allInStock: inRange && missing.length === 0 };
    })
    .filter((option) => stores.find((store) => store.id === option.storeId) && option.distanceKm <= stores.find((store) => store.id === option.storeId)!.deliveryRadiusKm)
    .sort((a, b) => Number(b.allInStock) - Number(a.allInStock) || b.available.length - a.available.length || a.distanceKm - b.distanceKm);
  if (!options.length) throw new Error("No MediSaarthi store delivers to this address.");
  const chosen = options[0];
  const distance = chosen.distanceKm.toFixed(1);
  const missing = chosen.missing;
  return { storeId: chosen.storeId, distanceKm: chosen.distanceKm, routingReason: chosen.allInStock ? `Nearest store with all ${items.length} items (${distance} km)` : `Partial stock at nearest available store (${distance} km)`, missing, available: chosen.available, partial: !chosen.allInStock, options: options.slice(0, 4) };
}

export async function reserveStock(prisma: Prisma.TransactionClient, items: RoutingItem[], storeId: string, date = new Date()) {
  const day = stockDate(date);
  for (const item of items) {
    const updated = await prisma.stock.updateMany({ where: { storeId, productId: item.productId, date: day, qty: { gte: item.quantity } }, data: { qty: { decrement: item.quantity } } });
    if (updated.count !== 1) throw new Error("Stock changed while placing this order. Please try again.");
  }
}

export async function releaseStock(prisma: Prisma.TransactionClient, items: RoutingItem[], storeId: string, date = new Date()) {
  const day = stockDate(date);
  for (const item of items) {
    await prisma.stock.updateMany({ where: { storeId, productId: item.productId, date: day }, data: { qty: { increment: item.quantity } } });
  }
}
