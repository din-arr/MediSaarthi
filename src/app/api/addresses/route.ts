import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";

export async function GET() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const addresses = await prisma.address.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(addresses);
}
