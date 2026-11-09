import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
// Postgres matches case-sensitively by default; SQLite already ignores case.
const caseless = (process.env.DATABASE_URL ?? "").startsWith("postgres") ? ({ mode: "insensitive" } as object) : {};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const products = await prisma.product.findMany({ where: query ? { OR: [{ name: { contains: query, ...caseless } }, { strength: { contains: query, ...caseless } }] } : undefined, orderBy: { name: "asc" }, take: 30 });
  return NextResponse.json(products.map((product) => ({ id: product.id, name: product.name, strength: product.strength, packSize: product.packSize, schedule: product.schedule, price: Number(product.price) })));
}
