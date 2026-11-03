import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../../lib/session";
import { expiredSessionResponse } from "../../../../../lib/apiErrors";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const source = await prisma.order.findFirst({ where: { id, customerId: session.userId }, include: { items: true } });
  if (!source) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const order = await prisma.order.create({ data: { number: `RX-${Math.floor(50000 + Math.random() * 49999)}`, customerId: session.userId, familyMemberId: source.familyMemberId, storeId: source.storeId, status: "AWAITING_PHARMACIST", total: source.total, items: { create: source.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice })) } } });
  return NextResponse.json({ id: order.id });
}
