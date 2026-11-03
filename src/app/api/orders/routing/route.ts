import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { routeOrder } from "../../../../lib/routing";
import { getSession, SESSION_COOKIE } from "../../../../lib/session";
import { expiredSessionResponse } from "../../../../lib/apiErrors";

export async function POST(request: Request) {
  const session = await getSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return expiredSessionResponse();
  if (session.role !== "CUSTOMER") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { addressId?: string; items?: Array<{ productId: string; quantity: number }> };
  if (!body.addressId || !body.items?.length) return NextResponse.json({ error: "Choose an address and add an item first." }, { status: 400 });
  const address = await prisma.address.findFirst({ where: { id: body.addressId, userId: session.userId } });
  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
  const products = await prisma.product.findMany({ where: { id: { in: body.items.map((item) => item.productId) } }, select: { id: true, name: true, strength: true } });
  const items = body.items.map((item) => ({ ...item, name: products.find((product) => product.id === item.productId)?.name }));
  try {
    return NextResponse.json(await routeOrder(prisma, items, address.lat, address.lng));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not find a delivery store." }, { status: 400 });
  }
}
