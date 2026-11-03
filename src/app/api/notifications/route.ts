import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../lib/session";
import { expiredSessionResponse } from "../../../lib/apiErrors";

export async function GET() {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  const items = await prisma.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ unread: items.filter((item) => !item.read).length, items });
}

export async function PATCH() {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  await prisma.notification.updateMany({ where: { userId: session.userId, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
