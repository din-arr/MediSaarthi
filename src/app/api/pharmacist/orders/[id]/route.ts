import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requirePharmacist } from "../../../../../lib/pharmacy/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePharmacist();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true, familyMember: true, store: true, address: true, prescription: true, h1Entries: true,
      items: { include: { product: { include: { genericOf: true } }, suggestedProduct: true }, orderBy: { id: "asc" } },
      auditLogs: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const draft = Array.isArray(order.prescription?.aiDraft) ? order.prescription.aiDraft as Array<{ name?: string; confidence?: number }> : [];
  const generics = await prisma.product.findMany({ where: { name: { in: order.items.map((item) => item.product.name) } } });
  return NextResponse.json({
    id: order.id, number: order.number, status: order.status, createdAt: order.createdAt, decisionReason: order.decisionReason,
    customer: { name: order.customer.name, phone: order.customer.phone },
    patient: order.familyMember ? { name: order.familyMember.name, relation: order.familyMember.relation } : { name: order.customer.name, relation: "Self" },
    address: order.address ? `${order.address.line1}, ${order.address.line2}, ${order.address.area} ${order.address.pincode}` : "",
    store: order.store?.name ?? null,
    prescription: order.prescription ? { id: order.prescription.id, doctorName: order.prescription.doctorName ?? "", doctorRegNo: order.prescription.doctorRegNo ?? "", issuedOn: order.prescription.issuedOn ?? null, uploadedAt: order.prescription.uploadedAt } : null,
    items: order.items.map((item) => {
      const ai = draft.find((entry) => entry.name && item.product.name.toLowerCase().includes(entry.name.toLowerCase()));
      return {
        id: item.id, productId: item.productId, name: item.product.name, strength: item.product.strength, packSize: item.product.packSize,
        schedule: item.product.schedule, quantity: item.quantity, originalQty: item.originalQty, approvalStatus: item.approvalStatus,
        rejectReason: item.rejectReason, confidence: ai?.confidence ?? null, price: Number(item.product.price), consentStatus: item.consentStatus,
        generic: item.product.genericOf ? { name: item.product.genericOf.name, strength: item.product.genericOf.strength, price: Number(item.product.genericOf.price) } : null,
        otherStrengths: generics.filter((product) => product.name === item.product.name && product.id !== item.productId).map((product) => ({ id: product.id, strength: product.strength, packSize: product.packSize })),
      };
    }),
    audit: order.auditLogs.map((log) => ({ action: log.action, by: log.user.name, at: log.createdAt, detail: log.detail })),
  });
}
