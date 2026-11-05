import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { GET as queue } from "../../src/app/api/pharmacist/queue/route";
import { GET as orderDetail } from "../../src/app/api/pharmacist/orders/[id]/route";
import { PATCH as decideItem } from "../../src/app/api/pharmacist/orders/[id]/items/[itemId]/route";
import { POST as decide } from "../../src/app/api/pharmacist/orders/[id]/decision/route";
import { GET as prescriptionFile } from "../../src/app/api/pharmacist/prescriptions/[id]/file/route";
import { GET as storeOrders } from "../../src/app/api/pharmacist/store/route";
import { GET as dashboard } from "../../src/app/api/pharmacist/dashboard/route";
import { POST as runReminders } from "../../src/app/api/pharmacist/reminders/route";
import { encryptBuffer } from "../../src/lib/prescriptions/crypto";
import { jsonRequest, makeOrder, params, prisma, seedWorld, signIn, stub, type World } from "../support/db";

let world: World;
beforeEach(async () => { world = await seedWorld(); await signIn(world.users.pharmacist); });

const get = (url: string) => new Request(`http://localhost${url}`);
const quietly = async <T>(work: () => Promise<T>) => {
  const error = console.error;
  console.error = () => {};
  try { return await work(); } finally { console.error = error; }
};
const approveBody = { action: "approve", doctorName: "Dr. Sen", doctorRegNo: "WBMC-1", issuedOn: new Date().toISOString() };

test("staff routes check the role", async () => {
  await signIn(world.users.customer);
  assert.equal((await queue()).status, 403);
  assert.equal((await dashboard(get("/api/pharmacist/dashboard"))).status, 403);
  await signIn(world.users.staff);
  assert.equal((await queue()).status, 403);
  assert.equal((await runReminders()).status, 403);
  await signIn();
  assert.equal((await queue()).status, 401);
  for (const call of [() => orderDetail(get("/x"), params({ id: "x" })), () => decideItem(jsonRequest("/x", "PATCH", {}), params({ id: "x", itemId: "y" })), () => decide(jsonRequest("/x", "POST", {}), params({ id: "x" })), () => prescriptionFile(get("/x"), params({ id: "x" })), () => storeOrders(get("/x"))]) {
    assert.equal((await call()).status, 401);
  }
});

test("queue: oldest first with stats and the strictest schedule", async () => {
  const old = new Date(Date.now() - 45 * 60_000);
  await makeOrder(world, { createdAt: old, familyMemberId: world.mother.id, items: [{ productId: world.products.paracetamol.id }, { productId: world.products.alprazolam.id }, { productId: world.products.metformin.id }], prescription: { aiDraft: [{ confidence: 0.9 }, { confidence: 0.6 }, {}] } });
  await makeOrder(world, { status: "PARTIAL", storeId: null, items: [{ productId: world.products.paracetamol.id }] });
  await makeOrder(world, { status: "APPROVED", verifiedAt: new Date(), createdAt: new Date(Date.now() - 6 * 60_000) });
  await makeOrder(world, { status: "REJECTED", verifiedAt: new Date(), createdAt: new Date(Date.now() - 2 * 60_000) });
  await prisma.user.update({ where: { id: world.users.customer.id }, data: { name: null } });
  const data = await (await queue()).json();
  assert.equal(data.stats.waiting, 2);
  assert.equal(data.stats.approvedToday, 1);
  assert.equal(data.stats.rejectedToday, 1);
  assert.equal(data.stats.medianMinutes, 6);
  const [first, second] = data.orders;
  assert.equal(first.schedule, "H1");
  assert.equal(first.patient, "Madhabi · Mother");
  assert.equal(first.confidence, 0.6);
  assert.ok(first.waitingMinutes >= 44);
  assert.equal(first.customer, "9000000001");
  assert.equal(second.store, "Not routed");
  assert.equal(second.confidence, null);
  assert.equal(second.reupload, false);

  await prisma.order.deleteMany();
  assert.equal((await (await queue()).json()).stats.medianMinutes, null);
});

test("order detail: AI confidence, generics and other strengths", async () => {
  const order = await makeOrder(world, { items: [{ productId: world.products.glucora.id }, { productId: world.products.metformin.id }], prescription: { aiDraft: [{ name: "metformin", confidence: 0.7 }] } });
  await prisma.auditLog.create({ data: { orderId: order.id, userId: world.users.pharmacist.id, action: "VIEWED" } });
  assert.equal((await orderDetail(get("/x"), params({ id: "missing" }))).status, 404);
  const detail = await (await orderDetail(get("/x"), params({ id: order.id }))).json();
  assert.equal(detail.patient.relation, "Self");
  assert.match(detail.address, /12 Lake View/);
  const brand = detail.items.find((item: { name: string }) => item.name === "Glucora");
  const generic = detail.items.find((item: { name: string }) => item.name === "Metformin");
  assert.equal(brand.generic.name, "Metformin");
  assert.equal(brand.confidence, null);
  assert.equal(generic.confidence, 0.7);
  assert.equal(generic.otherStrengths[0].strength, "1000 mg");
  assert.equal(detail.audit[0].action, "VIEWED");

  const bare = await makeOrder(world, { familyMemberId: world.mother.id, storeId: null });
  await prisma.order.update({ where: { id: bare.id }, data: { addressId: null } });
  const bareDetail = await (await orderDetail(get("/x"), params({ id: bare.id }))).json();
  assert.equal(bareDetail.patient.name, "Madhabi");
  assert.equal(bareDetail.address, "");
  assert.equal(bareDetail.store, null);
  assert.equal(bareDetail.prescription, null);
  const withRx = await makeOrder(world, { prescription: true });
  assert.equal((await (await orderDetail(get("/x"), params({ id: withRx.id }))).json()).prescription.doctorName, "");
});

test("item decisions: approve, edit, reject and swap strength", async () => {
  const order = await makeOrder(world, { items: [{ productId: world.products.metformin.id }, { productId: world.products.telmisartan.id }] });
  const [first, second] = order.items;
  const patch = (itemId: string, body: unknown, id = order.id) => decideItem(jsonRequest("/x", "PATCH", body), params({ id, itemId }));
  assert.equal((await patch("missing", {})).status, 404);
  assert.equal((await patch(second.id, { decision: "REJECTED" })).status, 400);
  assert.equal((await patch(first.id, { quantity: 40 })).status, 400);
  assert.equal((await patch(first.id, { productId: "nope" })).status, 400);
  assert.equal((await patch(first.id, { productId: world.products.morphine.id })).status, 400);

  assert.equal((await (await patch(first.id, { decision: "APPROVED" })).json()).approvalStatus, "APPROVED");
  const edited = await (await patch(first.id, { decision: "APPROVED", quantity: 3, productId: world.products.metformin1000.id })).json();
  assert.equal(edited.approvalStatus, "EDITED");
  const saved = await prisma.orderItem.findUniqueOrThrow({ where: { id: first.id } });
  assert.equal(saved.originalQty, 2);
  assert.equal(saved.productId, world.products.metformin1000.id);
  assert.equal((await (await patch(first.id, { productId: world.products.metformin1000.id })).json()).approvalStatus, "EDITED");
  assert.equal((await (await patch(second.id, { decision: "REJECTED", reason: " Not legible " })).json()).approvalStatus, "REJECTED");
  assert.equal((await prisma.orderItem.findUniqueOrThrow({ where: { id: second.id } })).rejectReason, "Not legible");
  assert.equal((await (await patch(second.id, { decision: "PENDING" })).json()).approvalStatus, "PENDING");

  const decided = await makeOrder(world, { status: "APPROVED" });
  assert.equal((await patch(decided.items[0].id, { decision: "APPROVED" }, decided.id)).status, 409);
});

test("item decisions: offering a generic", async () => {
  const order = await makeOrder(world, { items: [{ productId: world.products.glucora.id }, { productId: world.products.metformin.id }] });
  const [brand, plain] = order.items;
  const offer = (itemId: string) => decideItem(jsonRequest("/x", "PATCH", { offerGeneric: true }), params({ id: order.id, itemId }));
  assert.equal((await offer(plain.id)).status, 400);
  assert.deepEqual(await (await offer(brand.id)).json(), { consentStatus: "PENDING" });
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: brand.id } });
  assert.equal(item.suggestedProductId, world.products.metformin.id);
  const message = await prisma.notification.findFirstOrThrow({ where: { orderId: order.id } });
  assert.match(message.message, /saves ₹120/);

  const restore = stub(prisma.product, "findUnique", async () => null);
  if (restore) {
    try { assert.equal((await offer(brand.id)).status, 404); } finally { restore(); }
  }
});

test("decision: reject and re-upload need a reason and release stock", async () => {
  const order = await makeOrder(world, { prescription: true });
  const send = (body: unknown, id = order.id) => decide(jsonRequest("/x", "POST", body), params({ id }));
  assert.equal((await send({ action: "reject" }, "missing")).status, 404);
  assert.equal((await send({ action: "reject" })).status, 400);
  assert.equal((await send({ action: "maybe" })).status, 400);
  assert.deepEqual(await (await send({ action: "reupload", reason: "Blurry photo" })).json(), { status: "REUPLOAD_REQUESTED" });
  assert.equal((await prisma.prescription.findUniqueOrThrow({ where: { id: order.prescription!.id } })).status, "REUPLOAD_REQUESTED");
  assert.deepEqual(await (await send({ action: "reject", reason: "Wrong patient" })).json(), { status: "REJECTED" });
  const stock = await prisma.stock.findFirstOrThrow({ where: { storeId: world.stores.saltLake.id, productId: world.products.metformin.id } });
  assert.equal(stock.qty, 52);
  assert.equal((await send({ action: "reject", reason: "Again" })).status, 409);

  const unrouted = await makeOrder(world, { storeId: null });
  assert.equal((await send({ action: "reject", reason: "No store" }, unrouted.id)).status, 200);
});

test("decision: approving Schedule H needs prescription details and writes refills", async () => {
  const noRx = await makeOrder(world, { items: [{ productId: world.products.metformin.id, approvalStatus: "APPROVED" }] });
  const send = (id: string, body: unknown) => decide(jsonRequest("/x", "POST", body), params({ id }));
  assert.equal((await send(noRx.id, approveBody)).status, 409);

  const order = await makeOrder(world, { familyMemberId: world.mother.id, prescription: true, items: [{ productId: world.products.metformin.id, approvalStatus: "APPROVED" }, { productId: world.products.telmisartan.id, approvalStatus: "APPROVED" }] });
  assert.equal((await send(order.id, { action: "approve" })).status, 400);
  await prisma.refill.create({ data: { customerId: world.users.customer.id, familyMemberId: world.mother.id, productId: world.products.metformin.id, dosePerDay: 1, lastQty: 1, nextRunOutDate: new Date() } });
  const [metformin, telmisartan] = order.items;
  const approved = await send(order.id, { ...approveBody, doses: { [metformin.id]: 2, [telmisartan.id]: 0 } });
  assert.deepEqual(await approved.json(), { status: "APPROVED" });
  const refills = await prisma.refill.findMany({ where: { customerId: world.users.customer.id } });
  assert.equal(refills.length, 1);
  assert.equal(refills[0].lastQty, 20);
  assert.equal(Math.round((refills[0].nextRunOutDate.getTime() - Date.now()) / 86_400_000), 10);
  assert.equal(await prisma.approval.count(), 1);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).verifiedById, world.users.pharmacist.id);
});

test("decision: H1 needs the patient address and goes in the register; OTC approves directly", async () => {
  const order = await makeOrder(world, { prescription: true, items: [{ productId: world.products.alprazolam.id, approvalStatus: "APPROVED" }] });
  const send = (id: string, body: unknown) => decide(jsonRequest("/x", "POST", body), params({ id }));
  assert.match((await (await send(order.id, approveBody)).json()).error, /patient's address/);
  assert.equal((await send(order.id, { ...approveBody, patientAddress: "12 Lake View, Kolkata" })).status, 200);
  const entry = await prisma.h1RegisterEntry.findFirstOrThrow({ where: { orderId: order.id } });
  assert.equal(entry.patient, "Debasish Ghosh");
  assert.equal(entry.prescriberRegNo, "WBMC-1");

  await prisma.user.update({ where: { id: world.users.customer.id }, data: { name: null } });
  const nameless = await makeOrder(world, { prescription: true, items: [{ productId: world.products.alprazolam.id, approvalStatus: "APPROVED" }] });
  await send(nameless.id, { ...approveBody, patientAddress: "x" });
  assert.equal((await prisma.h1RegisterEntry.findFirstOrThrow({ where: { orderId: nameless.id } })).patient, "Patient");
  const forMother = await makeOrder(world, { familyMemberId: world.mother.id, prescription: true, items: [{ productId: world.products.alprazolam.id, approvalStatus: "APPROVED" }] });
  await send(forMother.id, { ...approveBody, patientAddress: "x" });
  assert.equal((await prisma.h1RegisterEntry.findFirstOrThrow({ where: { orderId: forMother.id } })).patient, "Madhabi");

  const otc = await makeOrder(world, { items: [{ productId: world.products.paracetamol.id, approvalStatus: "APPROVED" }, { productId: world.products.metformin.id, approvalStatus: "REJECTED" }] });
  assert.equal((await send(otc.id, { action: "approve", reason: "Looks fine" })).status, 200);
  const pending = await makeOrder(world, { items: [{ productId: world.products.paracetamol.id }] });
  assert.equal((await send(pending.id, { action: "approve" })).status, 409);
});

test("decision: unexpected errors are a 500", async () => {
  const order = await makeOrder(world);
  const restore = stub(prisma, "$transaction", async () => { throw new Error("db down"); });
  if (restore) {
    try { assert.equal((await quietly(() => decide(jsonRequest("/x", "POST", { action: "approve" }), params({ id: order.id })))).status, 500); } finally { restore(); }
  }
});

test("prescription file: decrypts for pharmacists and logs the view", async () => {
  const stored = await encryptBuffer(Buffer.from("rx image"), "png");
  const rx = await prisma.prescription.create({ data: { uploadedById: world.users.customer.id, ...stored } });
  assert.equal((await prescriptionFile(get("/x"), params({ id: "missing" }))).status, 404);
  const response = await prescriptionFile(get("/x"), params({ id: rx.id }));
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(Buffer.from(await response.arrayBuffer()).toString(), "rx image");
  assert.equal(await prisma.prescriptionAccessLog.count({ where: { prescriptionId: rx.id, action: "VIEW" } }), 1);
  const broken = await prisma.prescription.create({ data: { uploadedById: world.users.customer.id, encryptedFilePath: "uploads/missing.png.enc" } });
  assert.equal((await quietly(() => prescriptionFile(get("/x"), params({ id: broken.id })))).status, 500);
});

test("store screen: staff see their own store, pharmacists can filter", async () => {
  await makeOrder(world, { status: "APPROVED", familyMemberId: world.mother.id, items: [{ productId: world.products.metformin.id, approvalStatus: "APPROVED" }, { productId: world.products.telmisartan.id, approvalStatus: "REJECTED" }] });
  const behala = await makeOrder(world, { status: "PACKED", storeId: world.stores.behala.id });
  await prisma.order.update({ where: { id: behala.id }, data: { addressId: null } });
  await makeOrder(world, { status: "AWAITING_PHARMACIST" });
  const all = await (await storeOrders(get("/api/pharmacist/store"))).json();
  assert.equal(all.stores.length, 2);
  assert.equal(all.orders.length, 2);
  const filtered = await (await storeOrders(get(`/api/pharmacist/store?store=${world.stores.behala.id}`))).json();
  assert.equal(filtered.orders.length, 1);
  assert.equal(filtered.orders[0].address, "");
  assert.equal(filtered.orders[0].phone, "9000000001");
  await signIn(world.users.staff);
  const own = await (await storeOrders(get(`/api/pharmacist/store?store=${world.stores.behala.id}`))).json();
  assert.deepEqual(own.stores.map((store: { name: string }) => store.name), ["MediSaarthi Salt Lake"]);
  assert.equal(own.orders.length, 1);
  assert.equal(own.orders[0].items.length, 1);
  assert.equal(own.orders[0].patient, "Madhabi");
});

test("dashboard: totals, timing, reasons and the safety check", async () => {
  const now = Date.now();
  await makeOrder(world, { status: "DELIVERED", createdAt: new Date(now - 20 * 60_000), verifiedAt: new Date(now - 15 * 60_000), items: [{ productId: world.products.metformin.id, approvalStatus: "APPROVED" }] });
  await makeOrder(world, { status: "PACKED", createdAt: new Date(now - 30 * 60_000), verifiedAt: new Date(now - 10 * 60_000), items: [{ productId: world.products.metformin.id, approvalStatus: "PENDING" }] });
  await makeOrder(world, { status: "REJECTED", decisionReason: "Expired prescription", createdAt: new Date(now - 10 * 60_000), verifiedAt: new Date(now - 8 * 60_000) });
  await makeOrder(world, { status: "REJECTED", decisionReason: "Expired prescription", storeId: world.stores.behala.id });
  await makeOrder(world, { status: "REJECTED" });
  const withRejectedItem = await makeOrder(world, { status: "AWAITING_PHARMACIST", items: [{ productId: world.products.metformin.id, approvalStatus: "REJECTED" }, { productId: world.products.paracetamol.id }] });
  await prisma.orderItem.update({ where: { id: withRejectedItem.items[0].id }, data: { rejectReason: "Not legible" } });
  await makeOrder(world, { status: "REUPLOAD_REQUESTED" });
  await makeOrder(world, { status: "APPROVED", verifiedAt: new Date(now - 60 * 60_000), createdAt: new Date(now) });
  await makeOrder(world, { status: "DELIVERED", createdAt: new Date(now - 40 * 86_400_000), items: [{ productId: world.products.paracetamol.id, approvalStatus: "APPROVED" }] });

  await signIn(world.users.ops);
  const data = await (await dashboard(get("/api/pharmacist/dashboard?days=500"))).json();
  assert.equal(data.days, 90);
  assert.equal(data.totals.orders, 9);
  assert.equal(data.totals.unsafeDispatches, 1);
  assert.equal(data.totals.rejected, 3);
  assert.equal(data.totals.reuploads, 1);
  assert.equal(data.totals.waiting, 1);
  assert.equal(data.totals.medianMinutes, 5);
  assert.equal(data.totals.within10, 67);
  assert.deepEqual(data.reasons[0], { reason: "Expired prescription", count: 2 });
  assert.equal(data.byStore[0].name, "MediSaarthi Salt Lake");
  assert.equal(data.byStore[1].medianMinutes, null);

  const week = await (await dashboard(get("/api/pharmacist/dashboard"))).json();
  assert.equal(week.days, 7);
  assert.equal(week.totals.orders, 8);
  await prisma.order.deleteMany();
  const empty = await (await dashboard(get("/api/pharmacist/dashboard?days=0"))).json();
  assert.equal(empty.days, 1);
  assert.equal(empty.totals.medianMinutes, null);
  assert.equal(empty.totals.within10, null);
});

test("reminders can be run on demand", async () => {
  await prisma.refill.create({ data: { customerId: world.users.customer.id, productId: world.products.metformin.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: new Date(Date.now() + 2 * 86_400_000) } });
  await signIn(world.users.ops);
  assert.deepEqual(await (await runReminders()).json(), { checked: 1, sent: 1 });
});
