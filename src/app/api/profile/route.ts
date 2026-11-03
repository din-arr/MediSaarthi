import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";
export async function GET() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, phone: true, preferredLanguage: true } });
  return NextResponse.json(user);
}
export async function PATCH(request: Request) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { preferredLanguage?: string };
  return NextResponse.json(await prisma.user.update({ where: { id: session.userId }, data: { preferredLanguage: body.preferredLanguage ?? "en" }, select: { preferredLanguage: true } }));
}
