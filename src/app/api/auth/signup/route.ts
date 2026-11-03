import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createSession, SESSION_COOKIE } from "../../../../lib/session";

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string; name?: string; language?: string; familyName?: string; relation?: string; consent?: boolean };
  const phone = body.phone?.replace(/\D/g, "");
  if (!phone || !body.name?.trim() || !body.consent) return NextResponse.json({ error: "Invalid profile." }, { status: 400 });

  const databaseUser = await prisma.user.create({ data: { phone, name: body.name.trim(), preferredLanguage: body.language ?? "en", role: "CUSTOMER" } });
  if (body.familyName?.trim()) await prisma.familyMember.create({ data: { userId: databaseUser.id, name: body.familyName.trim(), relation: body.relation ?? "Other" } });
  const user = { id: databaseUser.id, phone: databaseUser.phone, role: "CUSTOMER" as const, name: databaseUser.name ?? body.name.trim() };
  const response = NextResponse.json({ role: user.role });
  response.cookies.set(SESSION_COOKIE, await createSession({ userId: user.id, role: user.role, name: user.name }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
