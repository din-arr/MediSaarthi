import type { PrismaClient } from "@prisma/client";
import { notify } from "./notify";

/**
 * Daily reminder job: texts anyone whose medicine runs out within `withinDays`.
 * Skips people we already reminded in the last 2 days, so nobody gets spammed.
 */
export async function sendDueReminders(db: PrismaClient, withinDays = 5) {
  const cutoff = new Date(Date.now() + withinDays * 86_400_000);
  const recent = new Date(Date.now() - 2 * 86_400_000);
  const refills = await db.refill.findMany({ where: { nextRunOutDate: { lte: cutoff }, autoRemind: true }, include: { product: true, familyMember: true } });
  let sent = 0;
  for (const refill of refills) {
    const name = `${refill.product.name} ${refill.product.strength}`;
    const already = await db.notification.findFirst({ where: { userId: refill.customerId, createdAt: { gte: recent }, message: { contains: name } } });
    if (already) continue;
    const days = Math.max(0, Math.ceil((refill.nextRunOutDate.getTime() - Date.now()) / 86_400_000));
    const who = refill.familyMember ? `${refill.familyMember.name}'s` : "Your";
    await notify(db, refill.customerId, `${who} ${name} runs out in ${days} day${days === 1 ? "" : "s"}. Tap Reorder in MediSaarthi to get it today.`, undefined, "WHATSAPP");
    sent += 1;
  }
  return { checked: refills.length, sent };
}
