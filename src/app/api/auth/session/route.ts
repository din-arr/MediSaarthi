import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "../../../../lib/session";
import { expiredSessionResponse } from "../../../../lib/apiErrors";

export async function GET() {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  return NextResponse.json({ name: session.user.name ?? session.name, role: session.role, user: { registrationNumber: session.user.registrationNumber } });
}
