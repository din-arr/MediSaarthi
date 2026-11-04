import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/pharmacy/auth";
import { sendDueReminders } from "../../../../lib/reminders";

/** Runs the reminder job on demand (in production this would be a daily cron). */
export async function POST() {
  const auth = await requireRole("OPS", "PHARMACIST");
  if ("error" in auth) return auth.error;
  return NextResponse.json(await sendDueReminders(prisma));
}
