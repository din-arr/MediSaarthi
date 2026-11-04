// Runs before `next build`. Locally (SQLite) it does nothing.
// On Vercel with a Postgres DATABASE_URL it switches the Prisma provider,
// pushes the schema and seeds demo data once.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const url = process.env.DATABASE_URL ?? "";
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (!/^postgres(ql)?:\/\//.test(url)) {
  run("npx prisma generate");
  process.exit(0);
}

const schemaPath = "prisma/schema.prisma";
writeFileSync(schemaPath, readFileSync(schemaPath, "utf8").replace('provider = "sqlite"', 'provider = "postgresql"'));
run("npx prisma generate");
run("npx prisma db push --skip-generate");

const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
const stores = await db.store.count();
await db.$disconnect();
if (stores === 0) run("npx tsx prisma/seed.ts");
