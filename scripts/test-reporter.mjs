// Plain console reporter: one line per test, full details for failures.
// (Skips Node's coverage table, which crashes on some setups; scripts/test.mjs prints its own.)
import { inspect } from "node:util";

export default async function* reporter(source) {
  let passed = 0;
  const failures = [];
  for await (const event of source) {
    if (event.type === "test:pass" && event.data.details?.type !== "suite") {
      passed += 1;
      yield `  ✔ ${event.data.name}\n`;
    } else if (event.type === "test:fail" && event.data.details?.type !== "suite") {
      failures.push(event.data);
      yield `  ✖ ${event.data.name}\n`;
    } else if (event.type === "test:stderr" || event.type === "test:stdout") {
      yield event.data.message;
    }
  }
  for (const failure of failures) {
    yield `\n✖ ${failure.name} (${failure.file ?? ""}:${failure.line ?? ""})\n${inspect(failure.details?.error, { depth: 4 })}\n`;
  }
  yield `\n${passed} passed, ${failures.length} failed\n`;
}
