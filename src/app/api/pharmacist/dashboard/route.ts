import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/pharmacy/auth";

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** One view across all stores: orders, verification time, rejections and the Schedule H safety check. */
export async function GET(request: Request) {
  const auth = await requireRole("OPS", "PHARMACIST");
  if ("error" in auth) return auth.error;
  const days = Math.min(90, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 7)));
  const since = new Date(Date.now() - days * 86_400_000);
  const [stores, orders, rejectedItems] = await Promise.all([
    prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.order.findMany({ where: { createdAt: { gte: since } }, include: { items: { include: { product: true } } } }),
    prisma.orderItem.findMany({ where: { approvalStatus: "REJECTED", order: { createdAt: { gte: since } } }, select: { rejectReason: true } }),
  ]);

  const minutes = (order: (typeof orders)[number]) => order.verifiedAt ? (order.verifiedAt.getTime() - order.createdAt.getTime()) / 60000 : null;
  const verified = orders.map(minutes).filter((value): value is number => value !== null && value >= 0);
  const dispatched = ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
  const unsafe = orders.filter((order) => dispatched.includes(order.status) && order.items.some((item) => (item.product.schedule === "H" || item.product.schedule === "H1") && item.approvalStatus !== "APPROVED" && item.approvalStatus !== "EDITED"));

  const reasons = new Map<string, number>();
  for (const order of orders.filter((entry) => entry.status === "REJECTED" && entry.decisionReason)) reasons.set(order.decisionReason!, (reasons.get(order.decisionReason!) ?? 0) + 1);
  for (const item of rejectedItems) if (item.rejectReason) reasons.set(item.rejectReason, (reasons.get(item.rejectReason) ?? 0) + 1);

  const byStore = stores.map((store) => {
    const list = orders.filter((order) => order.storeId === store.id);
    const storeMinutes = list.map(minutes).filter((value): value is number => value !== null && value >= 0);
    return {
      id: store.id, name: store.name, total: list.length,
      waiting: list.filter((order) => order.status === "AWAITING_PHARMACIST" || order.status === "PARTIAL").length,
      inProgress: list.filter((order) => ["APPROVED", "PACKED", "OUT_FOR_DELIVERY"].includes(order.status)).length,
      delivered: list.filter((order) => order.status === "DELIVERED").length,
      rejected: list.filter((order) => order.status === "REJECTED").length,
      medianMinutes: median(storeMinutes),
    };
  }).sort((a, b) => b.total - a.total);

  return NextResponse.json({
    days,
    totals: {
      orders: orders.length,
      waiting: orders.filter((order) => order.status === "AWAITING_PHARMACIST" || order.status === "PARTIAL").length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
      rejected: orders.filter((order) => order.status === "REJECTED").length,
      reuploads: orders.filter((order) => order.status === "REUPLOAD_REQUESTED").length,
      medianMinutes: median(verified),
      within10: verified.length ? Math.round((verified.filter((value) => value <= 10).length / verified.length) * 100) : null,
      unsafeDispatches: unsafe.length,
    },
    unsafe: unsafe.map((order) => order.number),
    reasons: [...reasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    byStore,
  });
}
