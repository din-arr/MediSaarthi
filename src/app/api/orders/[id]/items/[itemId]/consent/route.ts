import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../../../../lib/session";
import { expiredSessionResponse } from "../../../../../../../lib/apiErrors";

/** Customer accepts or declines the generic the pharmacist suggested. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  const { id, itemId } = await params;
  const { accept } = await request.json() as { accept?: boolean };
  const item = await prisma.orderItem.findFirst({ where: { id: itemId, orderId: id, order: { customerId: session.userId } }, include: { suggestedProduct: true, order: { include: { items: true } } } });
  if (!item || item.consentStatus !== "PENDING" || !item.suggestedProduct) return NextResponse.json({ error: "There's nothing to confirm for this item." }, { status: 404 });
  await prisma.$transaction(async (tx) => {
    if (accept) {
      // The pharmacist already chose this generic, so the swap counts as their edit.
      await tx.orderItem.update({ where: { id: itemId }, data: { productId: item.suggestedProduct!.id, unitPrice: item.suggestedProduct!.price, consentStatus: "ACCEPTED", approvalStatus: "EDITED" } });
      const total = item.order.items.reduce((sum, entry) => sum + Number(entry.id === itemId ? item.suggestedProduct!.price : entry.unitPrice) * entry.quantity, 0);
      await tx.order.update({ where: { id }, data: { total } });
    } else {
      await tx.orderItem.update({ where: { id: itemId }, data: { consentStatus: "DECLINED", suggestedProductId: null, approvalStatus: "PENDING", decidedById: null, decidedAt: null } });
    }
    await tx.auditLog.create({ data: { orderId: id, userId: session.userId, action: accept ? "GENERIC_ACCEPTED" : "GENERIC_DECLINED" } });
  });
  return NextResponse.json({ consentStatus: accept ? "ACCEPTED" : "DECLINED" });
}
