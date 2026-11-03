import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { packCount, requirePharmacist } from "../../../../../../lib/pharmacy/auth";
import { assertTransition, RuleError } from "../../../../../../lib/pharmacy/orderRules";
import { releaseStock } from "../../../../../../lib/routing";

type Body = {
  action?: "approve" | "reupload" | "reject";
  reason?: string;
  doctorName?: string;
  doctorRegNo?: string;
  issuedOn?: string;
  patientAddress?: string;
  doses?: Record<string, number>;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePharmacist();
  if ("error" in auth) return auth.error;
  const pharmacistId = auth.session.userId;
  const { id } = await params;
  const body = await request.json() as Body;
  const reason = body.reason?.trim() ?? "";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: { include: { product: true } }, prescription: true, familyMember: true, customer: true } });
      if (!order) throw new RuleError("Order not found.", 404);

      if (body.action === "reject" || body.action === "reupload") {
        if (!reason) throw new RuleError("Please give the customer a reason.", 400);
        const to = body.action === "reject" ? "REJECTED" : "REUPLOAD_REQUESTED";
        await assertTransition(tx, id, to);
        if (to === "REJECTED" && order.storeId) await releaseStock(tx, order.items, order.storeId);
        if (order.prescription) await tx.prescription.update({ where: { id: order.prescription.id }, data: { status: to === "REJECTED" ? "REJECTED" : "REUPLOAD_REQUESTED" } });
        await tx.auditLog.create({ data: { orderId: id, userId: pharmacistId, action: to, detail: { reason } } });
        return tx.order.update({ where: { id }, data: { status: to, decisionReason: reason, verifiedById: pharmacistId, verifiedAt: new Date() } });
      }

      if (body.action !== "approve") throw new RuleError("Choose approve, re-upload or reject.", 400);
      const needsRx = order.items.some((item) => item.approvalStatus !== "REJECTED" && (item.product.schedule === "H" || item.product.schedule === "H1"));
      if (needsRx) {
        if (!order.prescription) throw new RuleError("This order has Schedule H items but no prescription.", 409);
        if (!body.doctorName?.trim() || !body.doctorRegNo?.trim() || !body.issuedOn) throw new RuleError("Add the doctor's name, registration number and the prescription date.", 400);
        await tx.prescription.update({ where: { id: order.prescription.id }, data: { doctorName: body.doctorName.trim(), doctorRegNo: body.doctorRegNo.trim(), issuedOn: new Date(body.issuedOn), status: "APPROVED" } });
        await tx.approval.create({ data: { prescriptionId: order.prescription.id, pharmacistId, notes: reason || null } });
      }
      // The H1 register entry is written in the same transaction as the approval.
      const h1Items = order.items.filter((item) => item.approvalStatus !== "REJECTED" && item.product.schedule === "H1");
      if (h1Items.length && !body.patientAddress?.trim()) throw new RuleError("Schedule H1 needs the patient's address for the register.", 400);
      for (const item of h1Items) {
        await tx.h1RegisterEntry.create({ data: { orderId: id, productId: item.productId, qty: item.quantity, prescriber: body.doctorName!.trim(), prescriberRegNo: body.doctorRegNo!.trim(), patient: order.familyMember?.name ?? order.customer.name ?? "Patient", patientAddress: body.patientAddress!.trim(), pharmacistId } });
      }
      await tx.order.update({ where: { id }, data: { verifiedById: pharmacistId, verifiedAt: new Date() } });
      await assertTransition(tx, id, "APPROVED");

      // Refill reminders from quantity and dosage.
      for (const item of order.items.filter((entry) => entry.approvalStatus !== "REJECTED")) {
        const dose = Number(body.doses?.[item.id] ?? 0);
        if (!dose || dose <= 0) continue;
        const days = Math.floor((item.quantity * packCount(item.product.packSize)) / dose);
        await tx.refill.deleteMany({ where: { customerId: order.customerId, familyMemberId: order.familyMemberId, productId: item.productId } });
        await tx.refill.create({ data: { customerId: order.customerId, familyMemberId: order.familyMemberId, productId: item.productId, dosePerDay: dose, lastQty: item.quantity * packCount(item.product.packSize), nextRunOutDate: new Date(Date.now() + days * 86_400_000) } });
      }
      await tx.auditLog.create({ data: { orderId: id, userId: pharmacistId, action: "APPROVED", detail: { note: reason || null } } });
      return tx.order.update({ where: { id }, data: { status: "APPROVED", decisionReason: null } });
    });
    return NextResponse.json({ status: result.status });
  } catch (error) {
    if (error instanceof RuleError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Decision failed", error);
    return NextResponse.json({ error: "Something went wrong saving this decision." }, { status: 500 });
  }
}
