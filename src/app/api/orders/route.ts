import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";

export async function GET() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const orders = await prisma.order.findMany({ where: { customerId: session.userId }, include: { store: true, items: { include: { product: true } }, familyMember: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders.map((order) => ({ id: order.id, number: order.number, status: order.status, store: order.store?.name ?? "", createdAt: order.createdAt.toISOString(), familyMember: order.familyMember ? `${order.familyMember.name} · ${order.familyMember.relation}` : "Me", items: order.items.map((item) => ({ productId: item.productId, name: `${item.product.name} ${item.product.strength}`, quantity: item.quantity, schedule: item.product.schedule })) })));
}

export async function POST(request: Request) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { prescriptionId?: string; familyMemberId?: string; items?: Array<{ productId: string; quantity: number }> };
  if (!body.items?.length || body.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) return NextResponse.json({ error: "Add at least one medicine." }, { status: 400 });
  const products = await prisma.product.findMany({ where: { id: { in: body.items.map((item) => item.productId) } } });
  if (products.some((product) => product.schedule === "X")) return NextResponse.json({ error: "Schedule X medicines cannot be sold online." }, { status: 400 });
  const store = await prisma.store.findFirst({ orderBy: { area: "asc" } });
  const total = body.items.reduce((sum, item) => sum + Number(products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0);
  const order = await prisma.order.create({ data: { number: `RX-${Math.floor(50000 + Math.random() * 49999)}`, customerId: session.userId, familyMemberId: body.familyMemberId || null, storeId: store?.id, status: "AWAITING_PHARMACIST", total, prescription: body.prescriptionId ? { connect: { id: body.prescriptionId } } : undefined, items: { create: body.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: Number(products.find((product) => product.id === item.productId)?.price ?? 0) })) } } });
  return NextResponse.json({ id: order.id });
}
