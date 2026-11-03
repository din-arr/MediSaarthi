import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../lib/session";
import { expiredSessionResponse, prismaErrorResponse } from "../../../lib/apiErrors";
import { encryptPrescription } from "../../../lib/prescriptions/crypto";
import { readPrescription } from "../../../lib/ai/readPrescription";

export async function POST(request: Request) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a prescription file." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Files must be 5 MB or smaller." }, { status: 400 });
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, or PDF file." }, { status: 400 });
  try {
    const encryptedFilePath = await encryptPrescription(file);
    const draft = await readPrescription(file);
    const prescription = await prisma.prescription.create({ data: { uploadedById: session.userId, encryptedFilePath, aiDraft: draft, status: "PENDING" } });
    await prisma.prescriptionAccessLog.create({ data: { userId: session.userId, prescriptionId: prescription.id, action: "UPLOAD" } });
    return NextResponse.json({ prescriptionId: prescription.id, draft });
  } catch (error) {
    return prismaErrorResponse(error, "We could not securely save that prescription.");
  }
}
