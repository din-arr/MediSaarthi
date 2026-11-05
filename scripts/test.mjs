// Runs unit + integration tests against a throwaway SQLite database,
// with coverage. Fails if coverage drops below the thresholds below.
//
//   npm test                 all tests + coverage gate
//   npm test -- --no-coverage  just the tests
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const thresholds = { lines: 90, branches: 90, functions: 90 };

const coverage = !process.argv.includes("--no-coverage");
const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: "file:./test.db",
  AUTH_SECRET: "test-only-auth-secret",
  PRESCRIPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
  TSX_TSCONFIG_PATH: "tsconfig.test.json",
  OTP_PROVIDER: "mock",
};
delete env.OPENAI_API_KEY;
delete env.PRESCRIPTION_STORAGE;

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function testFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) return testFiles(full);
    return name.endsWith(".test.ts") ? [full] : [];
  });
}

// Fresh schema every run.
run("npx", ["prisma", "db", "push", "--force-reset", "--skip-generate"]);

const args = ["--import", "tsx", "--test", "--test-concurrency=1"];
if (coverage) {
  // Node's own coverage table can crash while printing, so we write lcov and check it ourselves.
  mkdirSync("coverage", { recursive: true });
  args.push(
    "--experimental-test-coverage",
    "--test-coverage-include=src/lib/**",
    "--test-coverage-include=src/app/api/**",
    "--test-coverage-include=src/proxy.ts",
    "--test-reporter=./scripts/test-reporter.mjs", "--test-reporter-destination=stdout",
    "--test-reporter=lcov", "--test-reporter-destination=coverage/lcov.info",
  );
}
run(process.execPath, [...args, ...testFiles("tests").sort()]);
if (coverage) checkCoverage(readFileSync("coverage/lcov.info", "utf8"));

/** Prints a per-file table from lcov and fails if any total is under its threshold. */
function checkCoverage(lcov) {
  const files = lcov.split("end_of_record").map((record) => {
    const value = (key) => Number(record.match(new RegExp(`^${key}:(\\d+)`, "m"))?.[1] ?? 0);
    const file = record.match(/^SF:(.+)$/m)?.[1];
    return file && { file: path.relative(process.cwd(), file), lines: [value("LH"), value("LF")], branches: [value("BRH"), value("BRF")], functions: [value("FNH"), value("FNF")] };
  }).filter(Boolean);
  const pct = ([hit, found]) => (found ? (hit / found) * 100 : 100);
  const sum = (key) => files.reduce(([hit, found], entry) => [hit + entry[key][0], found + entry[key][1]], [0, 0]);
  console.log("\nCoverage (lines / branches / functions)");
  for (const entry of files.sort((a, b) => pct(a.lines) - pct(b.lines))) {
    console.log(`  ${pct(entry.lines).toFixed(1).padStart(5)}%  ${pct(entry.branches).toFixed(1).padStart(5)}%  ${pct(entry.functions).toFixed(1).padStart(5)}%  ${entry.file}`);
  }
  const totals = { lines: pct(sum("lines")), branches: pct(sum("branches")), functions: pct(sum("functions")) };
  console.log(`  ${totals.lines.toFixed(1).padStart(5)}%  ${totals.branches.toFixed(1).padStart(5)}%  ${totals.functions.toFixed(1).padStart(5)}%  TOTAL (${files.length} files)\n`);
  const failed = Object.entries(thresholds).filter(([key, minimum]) => totals[key] < minimum);
  for (const [key, minimum] of failed) console.error(`Coverage for ${key} is ${totals[key].toFixed(1)}%, below the ${minimum}% minimum.`);
  if (failed.length) process.exit(1);
  console.log(`Coverage OK (minimum ${thresholds.lines}% lines, ${thresholds.branches}% branches, ${thresholds.functions}% functions).`);
}
