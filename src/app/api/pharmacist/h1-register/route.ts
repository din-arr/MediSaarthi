import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/pharmacy/auth";

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  // Quote every cell, and stop spreadsheet formulas sneaking in from user-typed text.
  return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
};

/** Schedule H1 register as a CSV, in the columns an inspector asks for. */
export async function GET(request: Request) {
  const auth = await requireRole("OPS", "PHARMACIST");
  if ("error" in auth) return auth.error;
  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 90) || 90));
  const entries = await prisma.h1RegisterEntry.findMany({
    where: { date: { gte: new Date(Date.now() - days * 86_400_000) } },
    include: { product: true, order: true, pharmacist: true },
    orderBy: { date: "asc" },
  });
  const header = ["Date", "Order", "Medicine", "Quantity", "Patient", "Patient address", "Prescriber", "Prescriber reg. no.", "Dispensing pharmacist", "Pharmacist reg. no."];
  const rows = entries.map((entry) => [
    entry.date.toISOString().slice(0, 10), entry.order?.number, `${entry.product.name} ${entry.product.strength}`, entry.qty,
    entry.patient, entry.patientAddress, entry.prescriber, entry.prescriberRegNo, entry.pharmacist?.name, entry.pharmacist?.registrationNumber,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(`${csv}\r\n`, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="h1-register-last-${days}-days.csv"`, "cache-control": "private, no-store" },
  });
}
