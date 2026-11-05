import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { GET as listOrders, POST as placeOrder } from "../../src/app/api/orders/route";
import { POST as routing } from "../../src/app/api/orders/routing/route";
import { POST as pay } from "../../src/app/api/orders/[id]/pay/route";
import { POST as reupload } from "../../src/app/api/orders/[id]/reupload/route";
import { POST as reorder } from "../../src/app/api/orders/[id]/reorder/route";
import { POST as consent } from "../../src/app/api/orders/[id]/items/[itemId]/consent/route";
import { PATCH as moveOrder } from "../../src/app/api/orders/[id]/status/route";
import { jsonRequest, makeOrder, params, prisma, seedWorld, signIn, type World } from "../support/db";

let world: World;
beforeEach(async () => { world = await seedWorld(); await signIn(world.users.customer); });

const quietly = async <T>(work: () => Promise<T>) => {
  const error = console.error;
  console.error = () => {};
  try { return await work(); } finally { console.error = error; }
};

const upload = (file?: File) => {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("http://localhost/api/x", { method: "POST", body: form });
};

test("placing orders: validation and ownership checks", async () => {
  const p = world.products;
  const place = (body: unknown) => placeOrder(jsonRequest("/api/orders", "POST", body));
  assert.equal((await place({ items: [] })).status, 400);
  assert.equal((await place({ items: [{ productId: p.paracetamol.id, quantity: 0 }] })).status, 400);
  assert.equal((await place({ items: [{ productId: p.paracetamol.id, quantity: 1 }], familyMemberId: "nope" })).status, 400);
  assert.equal((await place({ items: [{ productId: p.paracetamol.id, quantity: 1 }], prescriptionId: "nope" })).status, 400);
  assert.equal((await place({ items: [{ productId: "nope", quantity: 1 }] })).status, 400);
  assert.match((await (await place({ items: [{ productId: p.morphine.id, quantity: 1 }] })).json()).error, /Schedule X/);
  const needsRx = await (await place({ items: [{ productId: p.metformin.id, quantity: 1 }] })).json();
  assert.equal(needsRx.needsPrescription, true);
  await signIn(world.users.other);
  assert.match((await (await place({ items: [{ productId: p.paracetamol.id, quantity: 1 }] })).json()).error, /delivery address/);
  await signIn(world.users.pharmacist);
  assert.equal((await place({ items: [] })).status, 401);
  await signIn();
  assert.equal((await place({ items: [] })).status, 401);
});

test("placing orders: OTC is confirmed, H waits for the pharmacist, and stock is reserved", async () => {
  const p = world.products;
  const otc = await (await placeOrder(jsonRequest("/api/orders", "POST", { items: [{ productId: p.paracetamol.id, quantity: 2 }] }))).json();
  const otcOrder = await prisma.order.findUniqueOrThrow({ where: { id: otc.id } });
  assert.equal(otcOrder.status, "APPROVED");
  assert.equal(otc.store, world.stores.saltLake.id);
  assert.equal(await prisma.notification.count({ where: { orderId: otc.id } }), 1);
  assert.equal((await prisma.stock.findFirstOrThrow({ where: { storeId: world.stores.saltLake.id, productId: p.paracetamol.id } })).qty, 48);

  const rx = await prisma.prescription.create({ data: { uploadedById: world.users.customer.id, encryptedFilePath: "db:png" } });
  const h = await (await placeOrder(jsonRequest("/api/orders", "POST", { items: [{ productId: p.metformin.id, quantity: 1 }], prescriptionId: rx.id, addressId: world.address.id, familyMemberId: world.mother.id }))).json();
  const hOrder = await prisma.order.findUniqueOrThrow({ where: { id: h.id }, include: { prescription: true } });
  assert.equal(hOrder.status, "AWAITING_PHARMACIST");
  assert.equal(hOrder.prescription?.id, rx.id);
});

test("placing orders: partial stock and no store in range", async () => {
  await prisma.stock.updateMany({ where: { productId: world.products.telmisartan.id }, data: { qty: 0 } });
  const partial = await (await placeOrder(jsonRequest("/api/orders", "POST", { items: [{ productId: world.products.paracetamol.id, quantity: 1 }, { productId: world.products.telmisartan.id, quantity: 1 }], prescriptionId: (await prisma.prescription.create({ data: { uploadedById: world.users.customer.id, encryptedFilePath: "db:png" } })).id }))).json();
  assert.deepEqual(partial.missingItems, [world.products.telmisartan.id]);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: partial.id } })).status, "PARTIAL");
  const far = await quietly(() => placeOrder(jsonRequest("/api/orders", "POST", { items: [{ productId: world.products.paracetamol.id, quantity: 1 }], deliveryLat: 29.15, deliveryLng: 75.72 })));
  assert.equal(far.status, 500);
});

test("listing orders shows items, suggestions and distance", async () => {
  const order = await makeOrder(world, { familyMemberId: world.mother.id, items: [{ productId: world.products.glucora.id }] });
  await prisma.orderItem.update({ where: { id: order.items[0].id }, data: { suggestedProductId: world.products.metformin.id, consentStatus: "PENDING" } });
  await makeOrder(world, { storeId: null, prescription: true });
  const orders = await (await listOrders()).json();
  assert.equal(orders.length, 2);
  const withSuggestion = orders.find((entry: { id: string }) => entry.id === order.id);
  assert.equal(withSuggestion.familyMember, "Madhabi · Mother");
  assert.equal(withSuggestion.items[0].suggestion.name, "Metformin 500 mg");
  assert.ok(withSuggestion.distanceKm < 1);
  const unrouted = orders.find((entry: { id: string }) => entry.id !== order.id);
  assert.equal(unrouted.distanceKm, null);
  assert.equal(unrouted.hasPrescription, true);
  assert.equal(unrouted.familyMember, "Me");
  await signIn();
  assert.equal((await listOrders()).status, 401);
});

test("routing preview", async () => {
  const ask = (body: unknown) => routing(jsonRequest("/api/orders/routing", "POST", body));
  assert.equal((await ask({})).status, 400);
  assert.equal((await ask({ addressId: "nope", items: [{ productId: world.products.metformin.id, quantity: 1 }] })).status, 404);
  const preview = await (await ask({ addressId: world.address.id, items: [{ productId: world.products.metformin.id, quantity: 1 }] })).json();
  assert.equal(preview.storeId, world.stores.saltLake.id);
  const far = await prisma.address.create({ data: { userId: world.users.customer.id, label: "Far", recipientName: "D", phone: "9000000001", line1: "a", line2: "b", area: "c", city: "Kolkata", pincode: "700064", lat: 29.15, lng: 75.72 } });
  assert.match((await (await ask({ addressId: far.id, items: [{ productId: world.products.metformin.id, quantity: 1 }] })).json()).error, /No MediSaarthi store/);
  await signIn(world.users.pharmacist);
  assert.equal((await ask({})).status, 401);
  await signIn();
  assert.equal((await ask({})).status, 401);
});

test("payment: test-mode UPI and cash on delivery", async () => {
  const order = await makeOrder(world, { status: "APPROVED" });
  const send = (id: string, body: unknown) => pay(jsonRequest(`/api/orders/${id}/pay`, "POST", body), params({ id }));
  assert.equal((await send(order.id, { method: "CARD" })).status, 400);
  assert.equal((await send("missing", { method: "UPI" })).status, 404);
  const waiting = await makeOrder(world);
  assert.equal((await send(waiting.id, { method: "UPI" })).status, 409);
  assert.equal((await send(order.id, { method: "UPI", upiId: "not an id" })).status, 400);
  assert.equal((await send(order.id, { method: "UPI", upiId: "rina@okaxis", outcome: "failure" })).status, 402);
  const paid = await (await send(order.id, { method: "UPI", upiId: "rina@okaxis" })).json();
  assert.equal(paid.paymentStatus, "PAID");
  assert.match(paid.paymentRef, /^TEST-UPI-/);
  assert.equal((await send(order.id, { method: "COD" })).status, 409);
  const cod = await makeOrder(world, { status: "APPROVED" });
  assert.deepEqual(await (await send(cod.id, { method: "COD" })).json(), { paymentStatus: "COD_PENDING", paymentRef: null });
  await signIn();
  assert.equal((await send(order.id, { method: "UPI" })).status, 401);
});

test("re-upload: only when asked, with a valid file", async () => {
  const order = await makeOrder(world, { status: "REUPLOAD_REQUESTED", prescription: true, items: [{ productId: world.products.metformin.id, approvalStatus: "REJECTED" }] });
  const send = (id: string, file?: File) => reupload(upload(file), params({ id }));
  const png = new File(["png-bytes"], "rx.png", { type: "image/png" });
  assert.equal((await send("missing", png)).status, 404);
  const other = await makeOrder(world);
  assert.equal((await send(other.id, png)).status, 409);
  assert.equal((await send(order.id)).status, 400);
  assert.equal((await send(order.id, new File(["x"], "rx.txt", { type: "text/plain" }))).status, 400);
  assert.equal((await send(order.id, new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }))).status, 400);
  assert.deepEqual(await (await send(order.id, png)).json(), { status: "AWAITING_PHARMACIST" });
  const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, prescription: true } });
  assert.equal(after.items[0].approvalStatus, "PENDING");
  assert.equal(after.prescription?.encryptedFilePath, "db:png");

  const noRx = await makeOrder(world, { status: "REUPLOAD_REQUESTED" });
  assert.equal((await send(noRx.id, png)).status, 200);
  assert.equal(await prisma.prescription.count({ where: { orderId: noRx.id } }), 1);
  await signIn();
  assert.equal((await send(order.id, png)).status, 401);
});

test("reorder: the same safety checks as a new order", async () => {
  const send = (id: string, body?: unknown) => reorder(body === "bad-json" ? new Request("http://localhost/x", { method: "POST", body: "{" }) : jsonRequest(`/api/orders/${id}/reorder`, "POST", body ?? {}), params({ id }));
  const hOrder = await makeOrder(world, { status: "DELIVERED", prescription: true, items: [{ productId: world.products.metformin.id, approvalStatus: "APPROVED" }, { productId: world.products.telmisartan.id, approvalStatus: "REJECTED" }] });
  assert.equal((await send("missing", { addressId: world.address.id })).status, 404);
  assert.equal((await send(hOrder.id, "bad-json")).status, 400);
  assert.equal((await send(hOrder.id, { addressId: world.address.id, items: [{ productId: world.products.paracetamol.id, quantity: 1 }] })).status, 400);
  assert.equal((await send(hOrder.id, { addressId: world.address.id, items: [{ productId: world.products.metformin.id, quantity: 99 }] })).status, 400);

  const created = await (await send(hOrder.id, { addressId: world.address.id })).json();
  const order = await prisma.order.findUniqueOrThrow({ where: { id: created.id }, include: { items: true, prescription: true } });
  assert.equal(order.status, "AWAITING_PHARMACIST");
  assert.equal(order.items.length, 1);
  assert.ok(order.prescription);

  const xOrder = await makeOrder(world, { status: "DELIVERED", items: [{ productId: world.products.morphine.id }] });
  assert.match((await (await send(xOrder.id, { addressId: world.address.id })).json()).error, /Schedule X/);
  const old = new Date(Date.now() - 400 * 86_400_000);
  const expired = await makeOrder(world, { status: "DELIVERED", prescription: { issuedOn: old, uploadedAt: old } });
  assert.equal((await (await send(expired.id, { addressId: world.address.id })).json()).needsPrescription, true);
  const noRx = await makeOrder(world, { status: "DELIVERED" });
  assert.equal((await send(noRx.id, { addressId: world.address.id })).status, 400);
  const uploadedOnly = await makeOrder(world, { status: "DELIVERED", prescription: { uploadedAt: new Date() } });
  assert.equal((await send(uploadedOnly.id, { addressId: world.address.id })).status, 200);

  const otc = await makeOrder(world, { status: "DELIVERED", items: [{ productId: world.products.paracetamol.id }] });
  const otcCopy = await (await send(otc.id, { addressId: world.address.id, items: [{ productId: world.products.paracetamol.id, quantity: 3 }] })).json();
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: otcCopy.id } })).status, "APPROVED");

  await prisma.stock.updateMany({ where: { productId: world.products.paracetamol.id }, data: { qty: 0 } });
  const partial = await (await send(otc.id, { addressId: world.address.id })).json();
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: partial.id } })).status, "PARTIAL");

  const far = await prisma.address.create({ data: { userId: world.users.customer.id, label: "Far", recipientName: "D", phone: "9000000001", line1: "a", line2: "b", area: "c", city: "Kolkata", pincode: "700064", lat: 29.15, lng: 75.72 } });
  assert.equal((await quietly(() => send(otc.id, { addressId: far.id }))).status, 500);

  await signIn(world.users.pharmacist);
  assert.equal((await send(otc.id, {})).status, 401);
  await signIn();
  assert.equal((await send(otc.id, {})).status, 401);
});

test("generic consent: accept swaps the medicine, decline sends it back to the pharmacist", async () => {
  const order = await makeOrder(world, { items: [{ productId: world.products.glucora.id, unitPrice: 90 }, { productId: world.products.paracetamol.id, unitPrice: 20, quantity: 1 }] });
  const [brand] = order.items.filter((item) => item.productId === world.products.glucora.id);
  const answer = (itemId: string, accept: boolean) => consent(jsonRequest("/x", "POST", { accept }), params({ id: order.id, itemId }));
  assert.equal((await answer(brand.id, true)).status, 404);
  await prisma.orderItem.update({ where: { id: brand.id }, data: { suggestedProductId: world.products.metformin.id, consentStatus: "PENDING" } });
  assert.deepEqual(await (await answer(brand.id, true)).json(), { consentStatus: "ACCEPTED" });
  const swapped = await prisma.orderItem.findUniqueOrThrow({ where: { id: brand.id } });
  assert.equal(swapped.productId, world.products.metformin.id);
  assert.equal(swapped.approvalStatus, "EDITED");
  assert.equal(Number((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).total), 30 * 2 + 20);

  await prisma.orderItem.update({ where: { id: brand.id }, data: { suggestedProductId: world.products.metformin.id, consentStatus: "PENDING", approvalStatus: "APPROVED" } });
  assert.deepEqual(await (await answer(brand.id, false)).json(), { consentStatus: "DECLINED" });
  const declined = await prisma.orderItem.findUniqueOrThrow({ where: { id: brand.id } });
  assert.equal(declined.approvalStatus, "PENDING");
  assert.equal(declined.suggestedProductId, null);
  await signIn();
  assert.equal((await answer(brand.id, true)).status, 401);
});

test("store moves: pack, hand over and deliver with checks", async () => {
  const move = (id: string, body: unknown) => moveOrder(jsonRequest(`/api/orders/${id}/status`, "PATCH", body), params({ id }));
  const order = await makeOrder(world, { status: "APPROVED", items: [{ productId: world.products.paracetamol.id, approvalStatus: "APPROVED" }] });
  assert.equal((await move(order.id, { status: "PACKED" })).status, 403);
  await signIn(world.users.staff);
  assert.equal((await move(order.id, { status: "APPROVED" })).status, 400);
  assert.equal((await move(order.id, {})).status, 400);
  assert.match((await (await move(order.id, { status: "PACKED", invoiceNumber: "INV-1" })).json()).error, /UPI or cash/);
  await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: "COD" } });
  assert.equal((await move(order.id, { status: "PACKED", invoiceNumber: "x" })).status, 400);
  assert.equal((await move(order.id, { status: "PACKED" })).status, 400);
  assert.equal((await move(order.id, { status: "OUT_FOR_DELIVERY", riderName: "Raju" })).status, 409);
  assert.deepEqual(await (await move(order.id, { status: "PACKED", invoiceNumber: "INV-2041" })).json(), { status: "PACKED" });
  assert.equal((await move(order.id, { status: "OUT_FOR_DELIVERY", riderName: " " })).status, 400);
  assert.equal((await move(order.id, { status: "OUT_FOR_DELIVERY", riderName: " Raju " })).status, 200);
  assert.equal((await move(order.id, { status: "DELIVERED" })).status, 200);
  const done = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(done.paymentStatus, "PAID");
  assert.equal(done.riderName, "Raju");
  assert.equal(await prisma.auditLog.count({ where: { orderId: order.id } }), 3);

  const upi = await makeOrder(world, { status: "OUT_FOR_DELIVERY", paymentMethod: "UPI", items: [{ productId: world.products.paracetamol.id, approvalStatus: "APPROVED" }] });
  assert.equal((await move(upi.id, { status: "DELIVERED" })).status, 200);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: upi.id } })).paymentStatus, "UNPAID");

  const otherStore = await makeOrder(world, { status: "APPROVED", storeId: world.stores.behala.id, paymentMethod: "COD", items: [{ productId: world.products.paracetamol.id, approvalStatus: "APPROVED" }] });
  assert.equal((await move(otherStore.id, { status: "PACKED", invoiceNumber: "INV-9" })).status, 403);
  assert.equal((await move("missing", { status: "PACKED" })).status, 404);
  await signIn(world.users.pharmacist);
  assert.equal((await move(otherStore.id, { status: "PACKED", invoiceNumber: "INV-9" })).status, 200);
  await signIn();
  assert.equal((await move(order.id, { status: "PACKED" })).status, 401);
});
