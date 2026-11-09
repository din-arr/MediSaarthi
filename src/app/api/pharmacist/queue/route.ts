import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requirePharmacist } from "../../../../lib/pharmacy/auth";
import { freshenDemoOrders } from "../../../../lib/demo";

const rank = { OTC: 0, H: 1, H1: 2, X: 3 } as const;

export async function GET() {
  const auth = await requirePharmacist();
  if ("error" in auth) return auth.error;
  await freshenDemoOrders(prisma);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [waiting, decidedToday] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["AWAITING_PHARMACIST", "PARTIAL"] } },
      include: { customer: true, familyMember: true, store: true, items: { include: { product: true } }, prescription: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({ where: { verifiedAt: { gte: startOfDay } }, select: { status: true, createdAt: true, verifiedAt: true } }),
  ]);
  const minutes = decidedToday.map((order) => (order.verifiedAt!.getTime() - order.createdAt.getTime()) / 60000).filter((value) => value >= 0).sort((a, b) => a - b);
  const median = minutes.length ? minutes[Math.floor(minutes.length / 2)] : null;
  return NextResponse.json({
    stats: {
      waiting: waiting.length,
      medianMinutes: median === null ? null : Math.round(median),
      approvedToday: decidedToday.filter((order) => order.status !== "REJECTED" && order.status !== "REUPLOAD_REQUESTED").length,
      rejectedToday: decidedToday.filter((order) => order.status === "REJECTED").length,
    },
    orders: waiting.map((order) => {
      const highest = order.items.reduce<keyof typeof rank>((top, item) => rank[item.product.schedule] > rank[top] ? item.product.schedule : top, "OTC");
      const draft = Array.isArray(order.prescription?.aiDraft) ? order.prescription.aiDraft as Array<{ confidence?: number }> : [];
      const confidence = draft.length ? Math.min(...draft.map((item) => item.confidence ?? 1)) : null;
      return {
        id: order.id, number: order.number,
        customer: order.customer.name ?? order.customer.phone,
        patient: order.familyMember ? `${order.familyMember.name} · ${order.familyMember.relation}` : "Self",
        items: order.items.length, schedule: highest, store: order.store?.name ?? "Not routed",
        waitingMinutes: Math.round((Date.now() - order.createdAt.getTime()) / 60000),
        confidence, reupload: order.status === "PARTIAL" ? false : undefined,
      };
    }),
  });
}
