import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE, type Role } from "../session";
import { expiredSessionResponse } from "../apiErrors";

/** Returns the staff session, or a ready-made error response if the role isn't allowed. */
export async function requireRole(...roles: Role[]) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return { error: expiredSessionResponse() } as const;
  if (!roles.includes(session.role)) return { error: NextResponse.json({ error: "You don't have access to this." }, { status: 403 }) } as const;
  return { session } as const;
}

export const requirePharmacist = () => requireRole("PHARMACIST");

export function packCount(packSize: string) {
  const match = packSize.match(/(\d+)/);
  return match ? Number(match[1]) : 1;
}
