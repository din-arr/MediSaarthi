import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "../prisma";
import type { OtpProvider, OtpSendResult } from "./provider";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export class MockOtpProvider implements OtpProvider {
  async sendOtp(phone: string): Promise<OtpSendResult> {
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const recent = await prisma.otpRequest.count({ where: { phone, createdAt: { gte: since } } });
    if (recent >= 3) throw new Error("RATE_LIMIT");
    const code = randomInt(100000, 1000000).toString();
    await prisma.otpRequest.create({ data: { phone, codeHash: hash(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
    return { demoCode: code };
  }

  async verifyOtp(phone: string, code: string) {
    const request = await prisma.otpRequest.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (!request || request.expiresAt < new Date()) throw new Error("EXPIRED");
    if (request.attempts >= MAX_ATTEMPTS) throw new Error("TOO_MANY_ATTEMPTS");
    const expected = Buffer.from(request.codeHash);
    const actual = Buffer.from(hash(code));
    const valid = expected.length === actual.length && timingSafeEqual(expected, actual);
    if (!valid) {
      await prisma.otpRequest.update({ where: { id: request.id }, data: { attempts: { increment: 1 } } });
      throw new Error(request.attempts + 1 >= MAX_ATTEMPTS ? "TOO_MANY_ATTEMPTS" : "INVALID_CODE");
    }
    await prisma.otpRequest.delete({ where: { id: request.id } });
  }
}
