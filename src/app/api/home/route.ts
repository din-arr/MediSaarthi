import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";

export async function GET() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      familyMembers: true,
      refills: { include: { product: true }, orderBy: { nextRunOutDate: "asc" } },
      orders: { include: { store: true, items: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return NextResponse.json({
    name: user.name ?? session.name,
    greeting,
    familyMembers: user.familyMembers.map((member) => ({ id: member.id, name: member.name, relation: member.relation })),
    refills: user.refills.map((refill) => ({ product: `${refill.product.name} ${refill.product.strength}`, nextRunOutDate: refill.nextRunOutDate.toISOString(), days: Math.max(0, Math.ceil((refill.nextRunOutDate.getTime() - Date.now()) / 86400000)), lastQty: refill.lastQty })),
    orders: user.orders.map((order) => ({ number: order.number, status: order.status, total: Number(order.total), createdAt: order.createdAt.toISOString(), store: order.store?.name ?? "", items: order.items.map((item) => `${item.product.name} ${item.product.strength}`) })),
  });
}
