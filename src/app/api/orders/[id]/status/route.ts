import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../../lib/session";
import { expiredSessionResponse } from "../../../../../lib/apiErrors";
import { assertTransition, RuleError } from "../../../../../lib/pharmacy/orderRules";
import type { Status } from "../../../../../lib/pharmacy/rules";
import { notify } from "../../../../../lib/notify";

/** Store-side moves (pack, hand over, deliver). Approval and rejection go through /api/pharmacist. */
const storeMoves: Status[] = ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

type Body = { status?: Status; invoiceNumber?: string; riderName?: string };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "PHARMACIST" && session.role !== "STORE_STAFF") return NextResponse.json({ error: "Only store staff can do this." }, { status: 403 });
  const { id } = await params;
  const body = await request.json() as Body;
  if (!body.status || !storeMoves.includes(body.status)) return NextResponse.json({ error: "Use the pharmacist screen to approve or reject." }, { status: 400 });
  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Schedule H checks run again here, so nothing gets packed or dispatched without approval.
      const order = await assertTransition(tx, id, body.status!);
      if (session.role === "STORE_STAFF" && order.storeId !== session.user.storeId) throw new RuleError("This order belongs to another store.", 403);
      const data: Record<string, unknown> = { status: body.status };
      if (body.status === "PACKED") {
        if (!order.paymentMethod) throw new RuleError("The customer hasn't chosen UPI or cash on delivery yet.", 409);
        const invoice = body.invoiceNumber?.trim();
        if (!invoice || !/^[A-Za-z0-9/-]{4,20}$/.test(invoice)) throw new RuleError("Enter the store invoice number (4–20 letters or numbers).", 400);
        Object.assign(data, { invoiceNumber: invoice, packedAt: new Date() });
      }
      if (body.status === "OUT_FOR_DELIVERY") {
        if (!body.riderName?.trim()) throw new RuleError("Who is delivering it? Add the rider's name.", 400);
        Object.assign(data, { riderName: body.riderName.trim(), handedOverAt: new Date() });
      }
      if (body.status === "DELIVERED") Object.assign(data, { deliveredAt: new Date(), ...(order.paymentMethod === "COD" ? { paymentStatus: "PAID" } : {}) });
      await tx.auditLog.create({ data: { orderId: id, userId: session.userId, action: body.status!, detail: { invoiceNumber: body.invoiceNumber ?? null, riderName: body.riderName ?? null } } });
      const messages: Record<string, string> = {
        PACKED: `${order.number} is packed and ready at your store.`,
        OUT_FOR_DELIVERY: `${order.number} is on the way with ${body.riderName?.trim()}.`,
        DELIVERED: `${order.number} was delivered. We'll remind you before you run out.`,
      };
      await notify(tx, order.customerId, messages[body.status!], id);
      return tx.order.update({ where: { id }, data });
    });
    return NextResponse.json({ status: updated.status });
  } catch (error) {
    if (error instanceof RuleError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
