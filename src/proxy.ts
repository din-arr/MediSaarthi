import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "./lib/session";

async function proxy(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  const expectedPath = session.role === "PHARMACIST" ? "/pharmacist/queue" : "/home";
  if (request.nextUrl.pathname !== expectedPath) return NextResponse.redirect(new URL(expectedPath, request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/home/:path*", "/pharmacist/queue/:path*"] };

export default proxy;
