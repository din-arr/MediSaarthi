import type { PrismaClient } from "@prisma/client";

/** Orders created by prisma/seed.ts for the demo. Real orders are never touched. */
export const demoOrderNumbers = ["RX-50211", "RX-50214", "RX-50219"];

/**
 * The seeded demo orders would otherwise show waits of hours or days to anyone
 * opening the demo later. If one has waited more than 2 hours, it is shown as
 * freshly placed (18 minutes ago) again. Set DEMO_FRESH_ORDERS=off to disable.
 */
export async function freshenDemoOrders(db: PrismaClient, now = new Date()) {
  if (process.env.DEMO_FRESH_ORDERS === "off") return 0;
  const stale = new Date(now.getTime() - 2 * 60 * 60_000);
  const result = await db.order.updateMany({
    where: { number: { in: demoOrderNumbers }, status: { in: ["AWAITING_PHARMACIST", "REUPLOAD_REQUESTED", "PARTIAL"] }, createdAt: { lt: stale } },
    data: { createdAt: new Date(now.getTime() - 18 * 60_000) },
  });
  return result.count;
}
