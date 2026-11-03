import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../lib/session";
import { notify } from "../../../lib/notify";
import { expiredSessionResponse, prismaErrorResponse } from "../../../lib/apiErrors";
import { haversineKm, reserveStock, routeOrder } from "../../../lib/routing";

export async function GET() {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  const orders = await prisma.order.findMany({ where: { customerId: session.userId }, include: { store: true, address: true, items: { include: { product: true } }, familyMember: true, prescription: { select: { id: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders.map((order) => ({ id: order.id, number: order.number, status: order.status, store: order.store?.name ?? "", distanceKm: order.address && order.store ? haversineKm(order.address.lat, order.address.lng, order.store.lat, order.store.lng) : null, routingReason: order.routingReason, missingItems: order.missingItems, createdAt: order.createdAt.toISOString(), familyMember: order.familyMember ? `${order.familyMember.name} · ${order.familyMember.relation}` : "Me", decisionReason: order.decisionReason, total: Number(order.total), paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, paymentRef: order.paymentRef, invoiceNumber: order.invoiceNumber, riderName: order.riderName, hasPrescription: Boolean(order.prescription), items: order.items.map((item) => ({ productId: item.productId, name: `${item.product.name} ${item.product.strength}`, quantity: item.quantity, originalQty: item.originalQty, approvalStatus: item.approvalStatus, rejectReason: item.rejectReason, schedule: item.product.schedule })) })));
}

export async function POST(request: Request) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { prescriptionId?: string; familyMemberId?: string; addressId?: string; deliveryLat?: number; deliveryLng?: number; items?: Array<{ productId: string; quantity: number }> };
  if (!body.items?.length || body.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) return NextResponse.json({ error: "Add at least one medicine." }, { status: 400 });
  const items = body.items;
  if (body.familyMemberId && !(await prisma.familyMember.findFirst({ where: { id: body.familyMemberId, userId: session.userId } }))) return NextResponse.json({ error: "That family member does not belong to your account." }, { status: 400 });
  if (body.prescriptionId && !(await prisma.prescription.findFirst({ where: { id: body.prescriptionId, uploadedById: session.userId } }))) return NextResponse.json({ error: "That prescription does not belong to your account." }, { status: 400 });
  const products = await prisma.product.findMany({ where: { id: { in: items.map((item) => item.productId) } } });
  if (products.length !== new Set(items.map((item) => item.productId)).size) return NextResponse.json({ error: "One or more medicines could not be found." }, { status: 400 });
  if (products.some((product) => product.schedule === "X")) return NextResponse.json({ error: "Schedule X medicines cannot be sold online." }, { status: 400 });
  // Prescription medicines always need a prescription; OTC-only orders don't.
  const otcOnly = products.every((product) => product.schedule === "OTC");
  if (!otcOnly && !body.prescriptionId) return NextResponse.json({ error: "Some of these medicines need a prescription. Please upload it first.", needsPrescription: true }, { status: 400 });
  const address = body.addressId ? await prisma.address.findFirst({ where: { id: body.addressId, userId: session.userId } }) : await prisma.address.findFirst({ where: { userId: session.userId }, orderBy: { createdAt: "asc" } });
  const deliveryLat = body.deliveryLat ?? address?.lat;
  const deliveryLng = body.deliveryLng ?? address?.lng;
  if (deliveryLat === undefined || deliveryLng === undefined) return NextResponse.json({ error: "Choose a delivery address before placing the order." }, { status: 400 });
  const total = items.reduce((sum, item) => sum + Number(products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0);
  try {
  const order = await prisma.$transaction(async (transaction) => {
    const routing = await routeOrder(transaction, items, deliveryLat, deliveryLng);
    await reserveStock(transaction, items.filter((item) => routing.available.includes(item.productId)), routing.storeId);
    return transaction.order.create({ data: { number: `RX-${Math.floor(50000 + Math.random() * 49999)}`, customerId: session.userId, familyMemberId: body.familyMemberId || null, addressId: address?.id, deliveryLat, deliveryLng, storeId: routing.storeId, routingReason: routing.routingReason, missingItems: routing.missing, status: routing.partial ? "PARTIAL" : otcOnly ? "APPROVED" : "AWAITING_PHARMACIST", total, prescription: body.prescriptionId ? { connect: { id: body.prescriptionId } } : undefined, items: { create: items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: Number(products.find((product) => product.id === item.productId)?.price ?? 0), approvalStatus: otcOnly ? "APPROVED" : "PENDING" })) } } });
  });
  if (otcOnly && order.status === "APPROVED") await notify(prisma, session.userId, `${order.number} is confirmed. No prescription needed, so you can pay now.`, order.id);
  return NextResponse.json({ id: order.id, store: order.storeId, routingReason: order.routingReason, missingItems: order.missingItems });
  } catch (error) { return prismaErrorResponse(error, "We could not place this order. Please refresh and try again."); }
}
