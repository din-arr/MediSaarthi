import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../../lib/session";
import { expiredSessionResponse } from "../../../../../lib/apiErrors";
import { encryptPrescription } from "../../../../../lib/prescriptions/crypto";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Customer sends a clearer prescription after the pharmacist asked for one. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, customerId: session.userId }, include: { prescription: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "REUPLOAD_REQUESTED") return NextResponse.json({ error: "This order doesn't need a new prescription." }, { status: 409 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: "Use a JPG, PNG or PDF." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "The file is bigger than 4 MB." }, { status: 400 });
  const stored = await encryptPrescription(file);
  await prisma.$transaction(async (tx) => {
    if (order.prescription) await tx.prescription.update({ where: { id: order.prescription.id }, data: { ...stored, status: "PENDING", uploadedAt: new Date() } });
    else await tx.prescription.create({ data: { uploadedById: session.userId, orderId: id, ...stored } });
    await tx.orderItem.updateMany({ where: { orderId: id }, data: { approvalStatus: "PENDING", rejectReason: null, decidedById: null, decidedAt: null } });
    await tx.order.update({ where: { id }, data: { status: "AWAITING_PHARMACIST", decisionReason: null } });
    await tx.auditLog.create({ data: { orderId: id, userId: session.userId, action: "REUPLOADED" } });
  });
  return NextResponse.json({ status: "AWAITING_PHARMACIST" });
}
