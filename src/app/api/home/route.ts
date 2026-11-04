import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../lib/session";
import { expiredSessionResponse } from "../../../lib/apiErrors";

export async function GET(request: Request) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const familyMemberId = new URL(request.url).searchParams.get("familyMemberId");
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      familyMembers: true,
      refills: { where: familyMemberId ? { familyMemberId } : { familyMemberId: null }, include: { product: true }, orderBy: { nextRunOutDate: "asc" } },
      orders: { where: familyMemberId ? { familyMemberId } : { familyMemberId: null }, include: { store: true, items: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const [allRefills, allOrders] = await Promise.all([
    prisma.refill.findMany({ where: { customerId: user.id }, include: { product: true }, orderBy: { nextRunOutDate: "asc" } }),
    prisma.order.findMany({ where: { customerId: user.id }, select: { familyMemberId: true, createdAt: true } }),
  ]);
  const familyStats = [
    { id: "me", name: user.name ?? session.name, relation: null, refills: allRefills.filter((refill) => !refill.familyMemberId), ordersThisMonth: allOrders.filter((order) => !order.familyMemberId && order.createdAt >= monthStart).length },
    ...user.familyMembers.map((member) => ({ id: member.id, name: member.name, relation: member.relation, refills: allRefills.filter((refill) => refill.familyMemberId === member.id), ordersThisMonth: allOrders.filter((order) => order.familyMemberId === member.id && order.createdAt >= monthStart).length })),
  ];
  const selectedPerson = familyStats.find((person) => person.id === (familyMemberId ?? "me")) ?? familyStats[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return NextResponse.json({
    name: user.name ?? session.name,
    greeting,
    familyMembers: user.familyMembers.map((member) => ({ id: member.id, name: member.name, relation: member.relation })),
    selectedPerson: { id: selectedPerson.id, name: selectedPerson.name, relation: selectedPerson.relation, refillCount: selectedPerson.refills.length, ordersThisMonth: selectedPerson.ordersThisMonth, nextRefill: selectedPerson.refills[0] ? { product: `${selectedPerson.refills[0].product.name} ${selectedPerson.refills[0].product.strength}`, days: Math.max(0, Math.ceil((selectedPerson.refills[0].nextRunOutDate.getTime() - Date.now()) / 86400000)) } : null },
    familyStats: familyStats.map((person) => ({ id: person.id, name: person.name, relation: person.relation, refillCount: person.refills.length, ordersThisMonth: person.ordersThisMonth, nextRefill: person.refills[0] ? { product: `${person.refills[0].product.name} ${person.refills[0].product.strength}`, days: Math.max(0, Math.ceil((person.refills[0].nextRunOutDate.getTime() - Date.now()) / 86400000)) } : null })),
    refills: user.refills.map((refill) => ({ productId: refill.productId, product: `${refill.product.name} ${refill.product.strength}`, nextRunOutDate: refill.nextRunOutDate.toISOString(), days: Math.max(0, Math.ceil((refill.nextRunOutDate.getTime() - Date.now()) / 86400000)), lastQty: refill.lastQty })),
    orders: user.orders.map((order) => ({ id: order.id, number: order.number, status: order.status, total: Number(order.total), createdAt: order.createdAt.toISOString(), store: order.store?.name ?? "", items: order.items.map((item) => `${item.product.name} ${item.product.strength}`) })),
  });
}
