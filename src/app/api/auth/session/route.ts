import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "../../../../lib/session";

export async function GET() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  return NextResponse.json({ name: session.name, role: session.role });
}
