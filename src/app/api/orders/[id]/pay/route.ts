import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../../lib/session";
import { expiredSessionResponse } from "../../../../../lib/apiErrors";
import { notify } from "../../../../../lib/notify";

/** Test-mode payment. Only allowed after the pharmacist has approved the order. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  const { id } = await params;
  const { method } = await request.json() as { method?: "UPI" | "COD" };
  if (method !== "UPI" && method !== "COD") return NextResponse.json({ error: "Choose UPI or cash on delivery." }, { status: 400 });
  const order = await prisma.order.findFirst({ where: { id, customerId: session.userId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "APPROVED") return NextResponse.json({ error: "You can pay once the pharmacist has approved your order." }, { status: 409 });
  if (order.paymentStatus === "PAID") return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
  const paymentRef = method === "UPI" ? `TEST-UPI-${randomBytes(4).toString("hex").toUpperCase()}` : null;
  const updated = await prisma.order.update({ where: { id }, data: { paymentMethod: method, paymentStatus: method === "UPI" ? "PAID" : "COD_PENDING", paymentRef } });
  await notify(prisma, session.userId, method === "UPI" ? `Payment received for ${order.number} (test mode). Your store is packing it now.` : `${order.number}: cash on delivery confirmed. Please keep ₹${Number(order.total)} ready.`, id);
  return NextResponse.json({ paymentStatus: updated.paymentStatus, paymentRef });
}
