import type { Prisma, PrismaClient } from "@prisma/client";
import { checkTransition, defaultRules, type RuleSettings, type ScheduleCode, type Status } from "./rules";

type Db = PrismaClient | Prisma.TransactionClient;

export async function loadRules(db: Db): Promise<RuleSettings> {
  const rows = await db.ruleConfig.findMany({ where: { key: { in: ["prescription_validity_days", "schedule_x_online_sale"] } } });
  const validity = rows.find((row) => row.key === "prescription_validity_days")?.value as { days?: number } | undefined;
  const x = rows.find((row) => row.key === "schedule_x_online_sale")?.value as { allowed?: boolean } | undefined;
  return { prescriptionValidityDays: validity?.days ?? defaultRules.prescriptionValidityDays, xAllowedOnline: x?.allowed ?? defaultRules.xAllowedOnline };
}

/** Loads the order from the database and runs the schedule rules. Use inside the same transaction as the update. */
export async function assertTransition(db: Db, orderId: string, to: Status) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, prescription: true, verifiedBy: true, h1Entries: true },
  });
  if (!order) throw new RuleError("Order not found.", 404);
  const problem = checkTransition({
    status: order.status as Status,
    verifiedByRegNo: order.verifiedBy?.registrationNumber ?? null,
    prescription: order.prescription,
    items: order.items.map((item) => ({
      schedule: item.product.schedule as ScheduleCode,
      approvalStatus: item.approvalStatus,
      name: `${item.product.name} ${item.product.strength}`,
      hasH1Entry: order.h1Entries.some((entry) => entry.productId === item.productId),
      awaitingConsent: item.consentStatus === "PENDING",
    })),
  }, to, await loadRules(db));
  if (problem) throw new RuleError(problem, 409);
  return order;
}

export class RuleError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
