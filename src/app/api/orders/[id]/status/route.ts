import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { releaseStock } from "../../../../../lib/routing";
import { readSession, SESSION_COOKIE } from "../../../../../lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "PHARMACIST") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { status?: "APPROVED" | "REJECTED" | "PACKED" };
  if (!body.status) return NextResponse.json({ error: "A status is required." }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const updated = await prisma.$transaction(async (transaction) => {
    if (body.status === "REJECTED" && order.storeId) await releaseStock(transaction, order.items, order.storeId);
    return transaction.order.update({ where: { id }, data: { status: body.status } });
  });
  return NextResponse.json({ status: updated.status });
}
