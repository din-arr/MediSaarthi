import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
// Order transactions run ~10 queries; on a remote database the default 5 s limit is too tight.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
