import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function prismaErrorResponse(error: unknown, fallback: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const messages: Record<string, string> = {
      P2002: "That record already exists. Please use a different value.",
      P2003: "This record refers to data that no longer exists. Please refresh and try again.",
      P2025: "That record could not be found. Please refresh and try again.",
    };
    const message = messages[error.code];
    if (message) return NextResponse.json({ error: message }, { status: error.code === "P2002" ? 409 : 400 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function expiredSessionResponse() {
  const response = NextResponse.json({ error: "SESSION_EXPIRED" }, { status: 401 });
  response.cookies.set("medisaarthi-session", "", { httpOnly: true, expires: new Date(0), sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return response;
}
