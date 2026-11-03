import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../../lib/session";
import { expiredSessionResponse } from "../../../../../lib/apiErrors";
import { assertTransition, RuleError } from "../../../../../lib/pharmacy/orderRules";
import type { Status } from "../../../../../lib/pharmacy/rules";

/** Store-side moves (pack, dispatch, deliver). Approval and rejection go through /api/pharmacist. */
const storeMoves: Status[] = ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "PHARMACIST") return NextResponse.json({ error: "Only store staff can do this." }, { status: 403 });
  const { id } = await params;
  const body = await request.json() as { status?: Status };
  if (!body.status || !storeMoves.includes(body.status)) return NextResponse.json({ error: "Use the pharmacist screen to approve or reject." }, { status: 400 });
  try {
    const updated = await prisma.$transaction(async (tx) => {
      await assertTransition(tx, id, body.status!);
      await tx.auditLog.create({ data: { orderId: id, userId: session.userId, action: body.status! } });
      return tx.order.update({ where: { id }, data: { status: body.status } });
    });
    return NextResponse.json({ status: updated.status });
  } catch (error) {
    if (error instanceof RuleError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
