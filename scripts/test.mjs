// Runs unit + integration tests against a throwaway SQLite database,
// with coverage. Fails if coverage drops below the thresholds below.
//
//   npm test                 all tests + coverage gate
//   npm test -- --no-coverage  just the tests
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
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
  args.push(
    "--experimental-test-coverage",
    "--test-coverage-include=src/lib/**",
    "--test-coverage-include=src/app/api/**",
    "--test-coverage-include=src/proxy.ts",
    `--test-coverage-lines=${thresholds.lines}`,
    `--test-coverage-branches=${thresholds.branches}`,
    `--test-coverage-functions=${thresholds.functions}`,
  );
}
run(process.execPath, [...args, ...testFiles("tests").sort()]);
