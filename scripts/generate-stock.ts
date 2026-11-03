import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  const [stores, products] = await Promise.all([prisma.store.findMany({ orderBy: { code: "asc" } }), prisma.product.findMany({ orderBy: { code: "asc" } })]);
  const lines = ["store_code,product_code,qty"];
  for (const store of stores) for (const product of products) {
    const gap = (store.code.length + product.code.length) % 17 === 0;
    lines.push(`${store.code},${product.code},${gap ? 0 : 12 + (product.code.length % 20)}`);
  }
  await mkdir("data", { recursive: true });
  await writeFile(`data/stock-${date}.csv`, `${lines.join("\n")}\n`);
  console.log(`Generated ${lines.length - 1} rows.`);
  await prisma.$disconnect();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
