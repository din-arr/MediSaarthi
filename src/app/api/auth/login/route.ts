import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createSession, SESSION_COOKIE, homeFor } from "../../../../lib/session";
import { getOtpProvider } from "../../../../lib/otp";

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string; otp?: string };
  const phone = body.phone?.replace(/\D/g, "");
  if (!phone || !/^\d{6}$/.test(body.otp ?? "")) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  try {
    await getOtpProvider().verifyOtp(phone, body.otp!);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_CODE";
    const message = code === "EXPIRED" ? "That code has expired. Request a new one." : code === "TOO_MANY_ATTEMPTS" ? "Too many attempts. Request a new code." : "That code is not correct.";
    return NextResponse.json({ error: message }, { status: code === "TOO_MANY_ATTEMPTS" ? 429 : 401 });
  }
  const databaseUser = await prisma.user.findUnique({ where: { phone } });
  const user = databaseUser
    ? { id: databaseUser.id, phone: databaseUser.phone, role: databaseUser.role, name: databaseUser.name ?? phone }
    : null;
  if (!user) return NextResponse.json({ needsProfile: true });

  const response = NextResponse.json({ role: user.role, home: homeFor[user.role] });
  response.cookies.set(SESSION_COOKIE, await createSession({ userId: user.id, role: user.role, name: user.name }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
