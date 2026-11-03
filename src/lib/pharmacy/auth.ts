import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "../session";
import { expiredSessionResponse } from "../apiErrors";

/** Returns the pharmacist session, or a ready-made error response. */
export async function requirePharmacist() {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return { error: expiredSessionResponse() } as const;
  if (session.role !== "PHARMACIST") return { error: NextResponse.json({ error: "Only pharmacists can do this." }, { status: 403 }) } as const;
  return { session } as const;
}

export function packCount(packSize: string) {
  const match = packSize.match(/(\d+)/);
  return match ? Number(match[1]) : 1;
}
