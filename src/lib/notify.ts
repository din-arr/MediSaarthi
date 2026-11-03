import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Mock SMS / WhatsApp. Nothing is really sent: messages are saved so the
 * customer sees them in-app and we can show them in a demo.
 */
export async function notify(db: Db, userId: string, message: string, orderId?: string, channel: "SMS" | "WHATSAPP" = "SMS") {
  await db.notification.create({ data: { userId, orderId, message, channel } });
  if (process.env.NODE_ENV !== "production") console.info(`[mock ${channel}] to ${userId}: ${message}`);
}
