import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "./lib/session";

async function proxy(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  const isPharmacistPath = request.nextUrl.pathname.startsWith("/pharmacist/queue");
  if (session.role === "PHARMACIST" && !isPharmacistPath) return NextResponse.redirect(new URL("/pharmacist/queue", request.url));
  if (session.role === "CUSTOMER" && isPharmacistPath) return NextResponse.redirect(new URL("/home", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/home/:path*", "/pharmacist/queue/:path*", "/upload/:path*", "/reorder/:path*", "/orders/:path*", "/search/:path*", "/family/:path*", "/profile/:path*"] };

export default proxy;
