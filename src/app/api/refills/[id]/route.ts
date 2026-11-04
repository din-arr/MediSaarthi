import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../../lib/session";
import { expiredSessionResponse } from "../../../../lib/apiErrors";

/** Turn the monthly refill reminder on or off for one medicine. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  const { id } = await params;
  const { autoRemind } = await request.json() as { autoRemind?: boolean };
  if (typeof autoRemind !== "boolean") return NextResponse.json({ error: "Say on or off." }, { status: 400 });
  const updated = await prisma.refill.updateMany({ where: { id, customerId: session.userId }, data: { autoRemind } });
  if (!updated.count) return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  return NextResponse.json({ autoRemind });
}
