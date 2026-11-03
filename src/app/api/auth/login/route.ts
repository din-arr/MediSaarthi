import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createSession, SESSION_COOKIE } from "../../../../lib/session";
import { mockUsers } from "../../../../lib/mockUsers";

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string; otp?: string };
  const phone = body.phone?.replace(/\D/g, "");
  if (!phone || body.otp !== "123456") return NextResponse.json({ error: "Invalid demo credentials." }, { status: 401 });

  let user = mockUsers.find((candidate) => candidate.phone === phone);
  if (process.env.DATABASE_URL) {
    try {
      const databaseUser = await prisma.user.findUnique({ where: { phone } });
      if (databaseUser && (databaseUser.role === "CUSTOMER" || databaseUser.role === "PHARMACIST")) {
        user = { id: databaseUser.id, phone: databaseUser.phone, role: databaseUser.role, name: databaseUser.name ?? phone };
      }
    } catch (error) {
      console.warn("Database user lookup unavailable; using demo users.", error);
    }
  }
  if (!user) return NextResponse.json({ needsProfile: true });

  const response = NextResponse.json({ role: user.role });
  response.cookies.set(SESSION_COOKIE, await createSession({ userId: user.id, role: user.role, name: user.name }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
