import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createSession, SESSION_COOKIE } from "../../../../lib/session";

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string; name?: string; language?: string; familyMembers?: Array<{ name?: string; relation?: string }>; consent?: boolean };
  const phone = body.phone?.replace(/\D/g, "");
  if (!phone || !body.name?.trim() || !body.consent) return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  const members = body.familyMembers ?? [];
  if (members.some((member) => !member.name?.trim() || !member.relation)) return NextResponse.json({ error: "Family member name and relation are required." }, { status: 400 });

  const databaseUser = await prisma.user.create({ data: { phone, name: body.name.trim(), preferredLanguage: body.language ?? "en", role: "CUSTOMER" } });
  if (members.length) await prisma.familyMember.createMany({ data: members.map((member) => ({ userId: databaseUser.id, name: member.name!.trim(), relation: member.relation! })) });
  const user = { id: databaseUser.id, phone: databaseUser.phone, role: "CUSTOMER" as const, name: databaseUser.name ?? body.name.trim() };
  const response = NextResponse.json({ role: user.role });
  response.cookies.set(SESSION_COOKIE, await createSession({ userId: user.id, role: user.role, name: user.name }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
