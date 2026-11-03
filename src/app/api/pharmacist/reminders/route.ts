import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requirePharmacist } from "../../../../lib/pharmacy/auth";
import { sendDueReminders } from "../../../../lib/reminders";

/** Runs the reminder job on demand (in production this would be a daily cron). */
export async function POST() {
  const auth = await requirePharmacist();
  if ("error" in auth) return auth.error;
  return NextResponse.json(await sendDueReminders(prisma));
}
