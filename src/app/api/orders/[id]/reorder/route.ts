import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../../lib/session";
import { expiredSessionResponse, prismaErrorResponse } from "../../../../../lib/apiErrors";
import { reserveStock, routeOrder } from "../../../../../lib/routing";
import { notify } from "../../../../../lib/notify";
import { loadRules } from "../../../../../lib/pharmacy/orderRules";

type Body = { addressId?: string; items?: Array<{ productId: string; quantity: number }> };

/**
 * Reorder from a past order. Goes through the same checks as a new order:
 * stock routing, Schedule X block, and a pharmacist check for H/H1 items
 * (the earlier prescription is reused while it's still valid).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({})) as Body;
  const source = await prisma.order.findFirst({ where: { id, customerId: session.userId }, include: { items: { include: { product: true } }, prescription: true } });
  if (!source) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const address = body.addressId ? await prisma.address.findFirst({ where: { id: body.addressId, userId: session.userId } }) : null;
  if (!address) return NextResponse.json({ error: "Choose a delivery address before placing the order." }, { status: 400 });

  const picked = (body.items?.length ? body.items : source.items.filter((item) => item.approvalStatus !== "REJECTED").map((item) => ({ productId: item.productId, quantity: item.quantity })))
    .filter((item) => Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 30);
  const products = picked.map((item) => ({ ...item, product: source.items.find((entry) => entry.productId === item.productId)?.product }));
  if (!products.length || products.some((item) => !item.product)) return NextResponse.json({ error: "Pick medicines from this order to reorder." }, { status: 400 });
  if (products.some((item) => item.product!.schedule === "X")) return NextResponse.json({ error: "Schedule X medicines can't be sold online." }, { status: 400 });

  const otcOnly = products.every((item) => item.product!.schedule === "OTC");
  const rules = await loadRules(prisma);
  const issued = source.prescription?.issuedOn ?? source.prescription?.uploadedAt;
  const stillValid = issued ? Date.now() - issued.getTime() <= rules.prescriptionValidityDays * 86_400_000 : false;
  if (!otcOnly && (!source.prescription || !stillValid)) return NextResponse.json({ error: "Your earlier prescription has expired. Please upload a new one.", needsPrescription: true }, { status: 400 });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const routing = await routeOrder(tx, picked, address.lat, address.lng);
      await reserveStock(tx, picked.filter((item) => routing.available.includes(item.productId)), routing.storeId);
      const created = await tx.order.create({ data: {
        number: `RX-${Math.floor(50000 + Math.random() * 49999)}`, customerId: session.userId, familyMemberId: source.familyMemberId,
        addressId: address.id, deliveryLat: address.lat, deliveryLng: address.lng, storeId: routing.storeId, routingReason: routing.routingReason, missingItems: routing.missing,
        status: routing.partial ? "PARTIAL" : otcOnly ? "APPROVED" : "AWAITING_PHARMACIST",
        total: products.reduce((sum, item) => sum + Number(item.product!.price) * item.quantity, 0),
        items: { create: products.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.product!.price, approvalStatus: otcOnly ? "APPROVED" : "PENDING" })) },
      } });
      // Same prescription file, new record, so the pharmacist checks it again for this order.
      if (source.prescription && !otcOnly) await tx.prescription.create({ data: { uploadedById: session.userId, orderId: created.id, encryptedFilePath: source.prescription.encryptedFilePath, fileData: source.prescription.fileData, aiDraft: source.prescription.aiDraft ?? undefined, doctorName: source.prescription.doctorName, doctorRegNo: source.prescription.doctorRegNo, issuedOn: source.prescription.issuedOn } });
      await notify(tx, session.userId, otcOnly ? `${created.number} is confirmed. You can pay now.` : `${created.number} placed. A pharmacist will check your prescription shortly.`, created.id);
      return created;
    });
    return NextResponse.json({ id: order.id });
  } catch (error) { return prismaErrorResponse(error, "We couldn't place this reorder. Please try again."); }
}
