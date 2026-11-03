import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "medisaarthi-session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "medisaarthi-demo-auth-secret-change-me");

export type Session = { userId: string; role: "CUSTOMER" | "PHARMACIST"; name: string };

export async function createSession(session: Session) {
  return new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string" || typeof payload.role !== "string" || typeof payload.name !== "string") return null;
    if (payload.role !== "CUSTOMER" && payload.role !== "PHARMACIST") return null;
    return { userId: payload.userId, role: payload.role, name: payload.name } as Session;
  } catch {
    return null;
  }
}

export async function getSession(token: string | undefined) {
  const session = await readSession(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== session.role) return null;
  return { ...session, user };
}
