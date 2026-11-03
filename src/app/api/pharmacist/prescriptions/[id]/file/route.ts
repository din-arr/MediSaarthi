import { prisma } from "../../../../../../lib/prisma";
import { requirePharmacist } from "../../../../../../lib/pharmacy/auth";
import { decryptPrescription } from "../../../../../../lib/prescriptions/crypto";

/** Streams a decrypted prescription to a pharmacist and logs the access (DPDP). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePharmacist();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const prescription = await prisma.prescription.findUnique({ where: { id } });
  if (!prescription) return new Response("Not found", { status: 404 });
  try {
    const { data, contentType } = await decryptPrescription(prescription.encryptedFilePath);
    await prisma.prescriptionAccessLog.create({ data: { userId: auth.session.userId, prescriptionId: id, action: "VIEW" } });
    return new Response(new Uint8Array(data), { headers: { "content-type": contentType, "cache-control": "private, no-store" } });
  } catch (error) {
    console.error("Could not open prescription", error);
    return new Response("This prescription file could not be opened.", { status: 500 });
  }
}
