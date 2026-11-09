import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/pharmacy/auth";

/** Orders the store needs to pick, pack and hand over. */
export async function GET(request: Request) {
  const auth = await requireRole("STORE_STAFF", "PHARMACIST", "OPS");
  if ("error" in auth) return auth.error;
  // Store staff only ever see their own store.
  const ownStore = auth.session.role === "STORE_STAFF" ? auth.session.user.storeId : null;
  const storeId = ownStore ?? (new URL(request.url).searchParams.get("store") || undefined);
  const [stores, orders] = await Promise.all([
    prisma.store.findMany({ where: ownStore ? { id: ownStore } : undefined, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where: { status: { in: ["APPROVED", "PACKED", "OUT_FOR_DELIVERY"] }, storeId },
      include: { customer: true, familyMember: true, address: true, store: true, items: { include: { product: true } } },
      orderBy: { updatedAt: "asc" },
    }),
  ]);
  return NextResponse.json({
    stores,
    orders: orders.map((order) => ({
      id: order.id, number: order.number, status: order.status, store: order.store?.name ?? "",
      patient: order.familyMember?.name ?? order.customer.name, phone: order.address?.phone ?? order.customer.phone,
      address: order.address ? `${order.address.line1}, ${order.address.area} ${order.address.pincode}` : "",
      paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, total: Number(order.total),
      invoiceNumber: order.invoiceNumber, riderName: order.riderName,
      items: order.items.filter((item) => item.approvalStatus !== "REJECTED").map((item) => ({ id: item.id, name: `${item.product.name} ${item.product.strength}`, pack: item.product.packSize, quantity: item.quantity, schedule: item.product.schedule })),
    })),
  });
}
