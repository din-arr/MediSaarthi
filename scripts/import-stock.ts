import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { PrismaClient } from "@prisma/client";

async function main() {
const prisma = new PrismaClient();
const file = process.argv[2];
if (!file) throw new Error("Usage: npm run stock:import -- data/stock-YYYY-MM-DD.csv");
const match = basename(file).match(/stock-(\d{4}-\d{2}-\d{2})\.csv$/);
if (!match) throw new Error("Stock file must be named stock-YYYY-MM-DD.csv");
const date = new Date(`${match[1]}T00:00:00.000Z`);
const rows = (await readFile(file, "utf8")).trim().split(/\r?\n/).slice(1).map((line, index) => {
  const [storeCode, productCode, rawQty] = line.split(",").map((part) => part.trim());
  return { line: index + 2, storeCode, productCode, qty: Number(rawQty) };
});
const [stores, products] = await Promise.all([prisma.store.findMany({ select: { id: true, code: true } }), prisma.product.findMany({ select: { id: true, code: true } })]);
const storesByCode = new Map(stores.map((store) => [store.code, store.id]));
const productsByCode = new Map(products.map((product) => [product.code, product.id]));
const errors: string[] = [];
for (const row of rows) {
  if (!storesByCode.has(row.storeCode)) errors.push(`line ${row.line}: unknown store ${row.storeCode}`);
  if (!productsByCode.has(row.productCode)) errors.push(`line ${row.line}: unknown product ${row.productCode}`);
  if (!Number.isInteger(row.qty) || row.qty < 0) errors.push(`line ${row.line}: negative or invalid quantity`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  for (const row of rows) await prisma.stock.upsert({ where: { storeId_productId_date: { storeId: storesByCode.get(row.storeCode)!, productId: productsByCode.get(row.productCode)!, date } }, update: { qty: row.qty }, create: { storeId: storesByCode.get(row.storeCode)!, productId: productsByCode.get(row.productCode)!, qty: row.qty, date } });
  console.log(`Imported ${rows.length} stock rows for ${match[1]}.`);
}
await prisma.$disconnect();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
