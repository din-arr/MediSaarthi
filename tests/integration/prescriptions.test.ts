import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { POST as uploadPrescription } from "../../src/app/api/prescriptions/route";
import { GET as getPrescription } from "../../src/app/api/prescriptions/[id]/route";
import { readPrescription } from "../../src/lib/ai/readPrescription";
import { assertTransition, loadRules, RuleError } from "../../src/lib/pharmacy/orderRules";
import { sendDueReminders } from "../../src/lib/reminders";
import { makeOrder, params, prisma, seedWorld, signIn, stub, type World } from "../support/db";

let world: World;
const realFetch = globalThis.fetch;
beforeEach(async () => { world = await seedWorld(); await signIn(world.users.customer); });
afterEach(() => { globalThis.fetch = realFetch; delete process.env.OPENAI_API_KEY; });

const png = (content = "image") => new File([content], "rx.png", { type: "image/png" });
const send = (file?: File) => {
  const form = new FormData();
  if (file) form.append("file", file);
  return uploadPrescription(new Request("http://localhost/api/prescriptions", { method: "POST", body: form }));
};
const openAiReplies = (content: unknown, ok = true) => {
  globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }] }), { status: ok ? 200 : 500 })) as unknown as typeof fetch;
};

test("upload: checks the file, encrypts it and returns an AI draft", async () => {
  assert.equal((await send()).status, 400);
  assert.equal((await send(new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }))).status, 400);
  assert.equal((await send(new File(["x"], "rx.gif", { type: "image/gif" }))).status, 400);
  const result = await (await send(png())).json();
  assert.ok(result.prescriptionId);
  assert.equal(result.draft.length, 2);
  const saved = await prisma.prescription.findUniqueOrThrow({ where: { id: result.prescriptionId } });
  assert.equal(saved.encryptedFilePath, "db:png");
  assert.ok(saved.fileData);
  assert.equal(await prisma.prescriptionAccessLog.count({ where: { action: "UPLOAD" } }), 1);
});

test("upload: staff and visitors can't upload; storage errors are handled", async () => {
  await signIn(world.users.pharmacist);
  assert.equal((await send(png())).status, 401);
  await signIn();
  assert.equal((await send(png())).status, 401);
  await signIn(world.users.customer);
  const key = process.env.PRESCRIPTION_KEY;
  delete process.env.PRESCRIPTION_KEY;
  const error = console.error;
  console.error = () => {};
  try {
    assert.equal((await send(png())).status, 500);
  } finally {
    process.env.PRESCRIPTION_KEY = key;
    console.error = error;
  }
});

test("customers can read back only their own prescription", async () => {
  const rx = await prisma.prescription.create({ data: { uploadedById: world.users.customer.id, encryptedFilePath: "db:png" } });
  const read = (id: string) => getPrescription(new Request("http://localhost/x"), params({ id }));
  assert.equal((await (await read(rx.id)).json()).id, rx.id);
  assert.equal(await prisma.prescriptionAccessLog.count({ where: { prescriptionId: rx.id } }), 1);
  await signIn(world.users.other);
  assert.equal((await read(rx.id)).status, 404);
  await signIn();
  assert.equal((await read(rx.id)).status, 401);
});

test("AI reading: uses the vision model and matches the catalogue", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  let sentBody = "";
  globalThis.fetch = (async (...args: unknown[]) => {
    sentBody = String((args[1] as RequestInit).body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ items: [
      { name: "Tab Metformin", strength: "1000mg", quantity: 3.4, confidence: 1.4 },
      { name: "Telmisartan", strength: "40", quantity: 50 },
      { name: "Unknownium" },
    ] }) } }] }));
  }) as unknown as typeof fetch;
  const draft = await readPrescription(png());
  assert.match(sentBody, /data:image\/png;base64,/);
  assert.equal(sentBody.includes("Morphine"), false);
  assert.deepEqual(draft.map((item) => [item.name, item.strength, item.quantity, item.confidence]), [["Metformin", "1000 mg", 3, 1], ["Telmisartan", "40 mg", 10, 0.6]]);
});

test("AI reading: falls back to a demo draft when the model fails or returns nothing", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  const warn = console.warn;
  console.warn = () => {};
  try {
    openAiReplies({}, false);
    assert.equal((await readPrescription(png())).length, 2);
    openAiReplies({ items: [] });
    assert.equal((await readPrescription(png())).length, 2);
    globalThis.fetch = (async () => new Response(JSON.stringify({}))) as unknown as typeof fetch;
    assert.equal((await readPrescription(png())).length, 2);
    openAiReplies({ items: [{ name: "Metformin", quantity: -2, confidence: -1 }] });
    const [item] = await readPrescription(png());
    assert.deepEqual([item.quantity, item.confidence], [1, 0]);
    openAiReplies({ items: [{ name: "Metformin" }] });
    assert.equal((await readPrescription(png()))[0].quantity, 1);
  } finally {
    console.warn = warn;
  }
  // PDFs never go to the vision model.
  globalThis.fetch = (async () => { throw new Error("should not be called"); }) as unknown as typeof fetch;
  assert.equal((await readPrescription(new File(["%PDF"], "rx.pdf", { type: "application/pdf" }))).length, 2);
});

test("AI reading: the demo draft varies by file and copes with an empty catalogue", async () => {
  const a = await readPrescription(png("a"));
  const b = await readPrescription(png("ab"));
  assert.notDeepEqual(a.map((item) => item.name), b.map((item) => item.name));
  assert.deepEqual(a.map((item) => item.confidence), [0.88, 0.64]);
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany({ where: { genericOfId: { not: null } } });
  await prisma.product.deleteMany();
  assert.deepEqual(await readPrescription(png()), []);
  await prisma.product.create({ data: { code: "ONLY", name: "Metformin", strength: "500 mg", packSize: "Strip of 10", form: "tablet", schedule: "H", price: 30 } });
  assert.equal((await readPrescription(png())).length, 1);
});

test("rules come from config, with safe defaults", async () => {
  assert.deepEqual(await loadRules(prisma), { prescriptionValidityDays: 180, xAllowedOnline: false });
  await prisma.ruleConfig.create({ data: { key: "prescription_validity_days", value: { days: 30 } } });
  await prisma.ruleConfig.create({ data: { key: "schedule_x_online_sale", value: { allowed: true } } });
  assert.deepEqual(await loadRules(prisma), { prescriptionValidityDays: 30, xAllowedOnline: true });
  await prisma.ruleConfig.updateMany({ data: { value: {} } });
  assert.deepEqual(await loadRules(prisma), { prescriptionValidityDays: 180, xAllowedOnline: false });
});

test("assertTransition runs the rules on the stored order", async () => {
  await assert.rejects(() => assertTransition(prisma, "missing", "APPROVED"), (error: unknown) => error instanceof RuleError && error.status === 404);
  const order = await makeOrder(world, { items: [{ productId: world.products.alprazolam.id, approvalStatus: "APPROVED" }], prescription: true, verifiedById: world.users.pharmacist.id });
  await assert.rejects(() => assertTransition(prisma, order.id, "APPROVED"), /H1 register/);
  await prisma.h1RegisterEntry.create({ data: { orderId: order.id, productId: world.products.alprazolam.id, qty: 1, prescriber: "Dr", patient: "P" } });
  assert.equal((await assertTransition(prisma, order.id, "APPROVED")).id, order.id);
  const generic = await makeOrder(world, { items: [{ productId: world.products.glucora.id, approvalStatus: "APPROVED" }] });
  await prisma.orderItem.updateMany({ where: { orderId: generic.id }, data: { consentStatus: "PENDING" } });
  await assert.rejects(() => assertTransition(prisma, generic.id, "APPROVED"), /accept or decline/);
});

test("reminders: due refills only, once every two days, worded per person", async () => {
  const soon = new Date(Date.now() + 86_400_000);
  await prisma.refill.create({ data: { customerId: world.users.customer.id, productId: world.products.metformin.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: soon } });
  await prisma.refill.create({ data: { customerId: world.users.customer.id, familyMemberId: world.mother.id, productId: world.products.telmisartan.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: new Date(Date.now() + 3 * 86_400_000) } });
  await prisma.refill.create({ data: { customerId: world.users.customer.id, productId: world.products.paracetamol.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: new Date(Date.now() - 86_400_000) } });
  await prisma.refill.create({ data: { customerId: world.users.customer.id, productId: world.products.alprazolam.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: soon, autoRemind: false } });
  await prisma.refill.create({ data: { customerId: world.users.customer.id, productId: world.products.metformin1000.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: new Date(Date.now() + 30 * 86_400_000) } });
  const info = console.info;
  console.info = () => {};
  try {
    assert.deepEqual(await sendDueReminders(prisma), { checked: 3, sent: 3 });
    assert.deepEqual(await sendDueReminders(prisma), { checked: 3, sent: 0 });
  } finally {
    console.info = info;
  }
  const messages = (await prisma.notification.findMany()).map((item) => item.message).sort();
  assert.ok(messages.some((message) => message.startsWith("Madhabi's Telmisartan 40 mg runs out in 3 days")));
  assert.ok(messages.some((message) => message.startsWith("Your Metformin 500 mg runs out in 1 day.")));
  assert.ok(messages.some((message) => message.includes("runs out in 0 days")));
});

test("stub helper reports objects that refuse stubbing", () => {
  const frozen = Object.freeze({ run: () => 1 });
  assert.equal(stub(frozen, "run", () => 2), null);
  const sealedSetter = { get run() { return 1; }, set run(value: number) { void value; } };
  assert.equal(stub(sealedSetter, "run", 2), null);
});
