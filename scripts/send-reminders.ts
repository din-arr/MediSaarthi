import { PrismaClient } from "@prisma/client";
import { sendDueReminders } from "../src/lib/reminders";

for (const file of [".env", ".env.local"]) { try { process.loadEnvFile(file); } catch { /* optional */ } }
const prisma = new PrismaClient();
sendDueReminders(prisma).then((result) => console.log(`Checked ${result.checked} refills, sent ${result.sent} reminders.`)).finally(() => prisma.$disconnect());
