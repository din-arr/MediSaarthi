import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../lib/session";
import { expiredSessionResponse } from "../../../../lib/apiErrors";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  const { id } = await context.params;
  const prescription = await prisma.prescription.findFirst({ where: { id, uploadedById: session.userId }, select: { id: true, aiDraft: true, status: true, encryptedFilePath: true } });
  if (!prescription) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
  await prisma.prescriptionAccessLog.create({ data: { userId: session.userId, prescriptionId: id, action: "VIEW" } });
  return NextResponse.json(prescription);
}
