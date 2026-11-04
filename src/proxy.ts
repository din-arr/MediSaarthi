import { NextRequest, NextResponse } from "next/server";
import { homeFor, readSession, SESSION_COOKIE } from "./lib/session";
import { canOpen } from "./lib/access";

async function proxy(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  // Each role only sees its own screens; anything else sends them to their home.
  if (!canOpen(session.role, request.nextUrl.pathname)) return NextResponse.redirect(new URL(homeFor[session.role], request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/home/:path*", "/pharmacist/:path*", "/upload/:path*", "/reorder/:path*", "/orders/:path*", "/search/:path*", "/family/:path*", "/profile/:path*", "/addresses/:path*", "/cart/:path*"] };

export default proxy;
