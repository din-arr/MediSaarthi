import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { requirePharmacist } from "../../../../../../../lib/pharmacy/auth";
import { notify } from "../../../../../../../lib/notify";

type Body = { decision?: "APPROVED" | "EDITED" | "REJECTED" | "PENDING"; quantity?: number; productId?: string; reason?: string; offerGeneric?: boolean };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await requirePharmacist();
  if ("error" in auth) return auth.error;
  const { id, itemId } = await params;
  const body = await request.json() as Body;
  const item = await prisma.orderItem.findFirst({ where: { id: itemId, orderId: id }, include: { order: true, product: true } });
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  if (!["AWAITING_PHARMACIST", "PARTIAL"].includes(item.order.status)) return NextResponse.json({ error: "This order has already been decided." }, { status: 409 });
  if (body.offerGeneric) {
    // Pharmacist picks the cheaper generic; it only counts once the customer agrees.
    if (!item.product.genericOfId) return NextResponse.json({ error: "There's no generic for this medicine." }, { status: 400 });
    const generic = await prisma.product.findUnique({ where: { id: item.product.genericOfId } });
    if (!generic) return NextResponse.json({ error: "Generic not found." }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.update({ where: { id: itemId }, data: { suggestedProductId: generic.id, consentStatus: "PENDING", decidedById: auth.session.userId, decidedAt: new Date() } });
      await tx.auditLog.create({ data: { orderId: id, userId: auth.session.userId, action: "GENERIC_OFFERED", detail: { from: `${item.product.name} ${item.product.strength}`, to: `${generic.name} ${generic.strength}` } } });
      const saving = (Number(item.product.price) - Number(generic.price)) * item.quantity;
      await notify(tx, item.order.customerId, `${item.order.number}: the pharmacist suggests ${generic.name} ${generic.strength} instead of ${item.product.name}. Same medicine, saves ₹${saving}. Open your order to accept or keep the original.`, id, "WHATSAPP");
    });
    return NextResponse.json({ consentStatus: "PENDING" });
  }
  if (body.decision === "REJECTED" && !body.reason?.trim()) return NextResponse.json({ error: "Give a reason for rejecting this item." }, { status: 400 });
  if (body.quantity !== undefined && (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 30)) return NextResponse.json({ error: "Quantity must be between 1 and 30." }, { status: 400 });
  let productId = item.productId;
  if (body.productId && body.productId !== item.productId) {
    const replacement = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!replacement) return NextResponse.json({ error: "That medicine wasn't found." }, { status: 400 });
    if (replacement.schedule === "X") return NextResponse.json({ error: "Schedule X medicines can't be sold online." }, { status: 400 });
    productId = replacement.id;
  }
  const changed = (body.quantity !== undefined && body.quantity !== item.quantity) || productId !== item.productId;
  const decision = body.decision === "APPROVED" && changed ? "EDITED" : body.decision ?? item.approvalStatus;
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.orderItem.update({
      where: { id: itemId },
      data: {
        approvalStatus: decision, productId, quantity: body.quantity ?? item.quantity,
        originalQty: changed ? item.originalQty ?? item.quantity : item.originalQty,
        rejectReason: decision === "REJECTED" ? body.reason!.trim() : null,
        decidedById: decision === "PENDING" ? null : auth.session.userId, decidedAt: decision === "PENDING" ? null : new Date(),
      },
    });
    await tx.auditLog.create({ data: { orderId: id, userId: auth.session.userId, action: `ITEM_${decision}`, detail: { item: `${item.product.name} ${item.product.strength}`, before: { qty: item.quantity, productId: item.productId }, after: { qty: next.quantity, productId: next.productId }, reason: body.reason ?? null } } });
    return next;
  });
  return NextResponse.json({ id: updated.id, approvalStatus: updated.approvalStatus, quantity: updated.quantity });
}
