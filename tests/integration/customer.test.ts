import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { DELETE as deleteAddress, GET as getAddresses, PATCH as patchAddress, POST as postAddress } from "../../src/app/api/addresses/route";
import { DELETE as deleteFamily, GET as getFamily, PATCH as patchFamily, POST as postFamily } from "../../src/app/api/family/route";
import { GET as home } from "../../src/app/api/home/route";
import { GET as getNotifications, PATCH as readNotifications } from "../../src/app/api/notifications/route";
import { GET as getProfile, PATCH as patchProfile } from "../../src/app/api/profile/route";
import { PATCH as patchRefill } from "../../src/app/api/refills/[id]/route";
import { GET as search } from "../../src/app/api/search/route";
import { jsonRequest, makeOrder, params, prisma, seedWorld, signIn, stub, type World } from "../support/db";

let world: World;
beforeEach(async () => { world = await seedWorld(); await signIn(world.users.customer); });

const get = (url: string) => new Request(`http://localhost${url}`);
const validAddress = { label: "Office", recipientName: "Debasish", phone: "9000000001", line1: "5 Park St", line2: "Opp. mall", area: "Behala", city: "Kolkata", pincode: "700034" };

test("customer-only routes refuse visitors and staff", async () => {
  await signIn();
  for (const call of [() => getAddresses(get("/api/addresses")), () => postAddress(jsonRequest("/api/addresses", "POST", {})), () => deleteAddress(get("/api/addresses?id=x")), () => getFamily(), () => postFamily(jsonRequest("/api/family", "POST", {})), () => patchFamily(jsonRequest("/api/family", "PATCH", {})), () => deleteFamily(get("/api/family?id=x")), () => home(get("/api/home")), () => getNotifications(), () => readNotifications(), () => getProfile(), () => patchProfile(jsonRequest("/api/profile", "PATCH", {})), () => patchRefill(jsonRequest("/api/refills/x", "PATCH", {}), params({ id: "x" }))]) {
    assert.equal((await call()).status, 401);
  }
  await signIn(world.users.pharmacist);
  for (const call of [() => getAddresses(get("/api/addresses")), () => postAddress(jsonRequest("/api/addresses", "POST", {})), () => deleteAddress(get("/api/addresses?id=x")), () => getFamily(), () => postFamily(jsonRequest("/api/family", "POST", {})), () => patchFamily(jsonRequest("/api/family", "PATCH", {})), () => deleteFamily(get("/api/family?id=x")), () => home(get("/api/home"))]) {
    const response = await call();
    assert.ok([400, 401].includes(response.status));
  }
});

test("addresses: list, pincode lookup and location detection", async () => {
  const list = await (await getAddresses(get("/api/addresses"))).json();
  assert.equal(list.length, 1);
  assert.equal((await (await getAddresses(get("/api/addresses?pincode=700064"))).json()).area, "Salt Lake");
  const unknownPin = await (await getAddresses(get("/api/addresses?pincode=700099"))).json();
  assert.equal(unknownPin.editableArea, true);
  assert.equal((await getAddresses(get("/api/addresses?pincode=110001"))).status, 404);
  const near = await (await getAddresses(get("/api/addresses?lat=22.587&lng=88.4171"))).json();
  assert.match(near.detected, /Salt Lake, 700064/);
  const far = await getAddresses(get("/api/addresses?lat=29.15&lng=75.72"));
  assert.equal(far.status, 400);
  assert.match((await far.json()).error, /outside our delivery area/);
  assert.equal((await getAddresses(get("/api/addresses?lat=22.65&lng=88.45"))).status, 404);
  await prisma.address.deleteMany();
  await prisma.pincode.deleteMany();
  assert.equal((await getAddresses(get("/api/addresses?lat=22.587&lng=88.417"))).status, 404);
  await prisma.user.updateMany({ data: { storeId: null } });
  await prisma.store.deleteMany({});
  assert.equal((await getAddresses(get("/api/addresses?lat=22.587&lng=88.417"))).status, 400);
});

test("addresses: field validation", async () => {
  const response = await postAddress(jsonRequest("/api/addresses", "POST", { pincode: "12" }));
  assert.equal(response.status, 400);
  const { fieldErrors } = await response.json();
  assert.deepEqual(Object.keys(fieldErrors).sort(), ["area", "city", "label", "line1", "line2", "phone", "pincode", "recipientName"]);
  const outside = await (await postAddress(jsonRequest("/api/addresses", "POST", { ...validAddress, pincode: "110001", city: "Delhi" }))).json();
  assert.match(outside.fieldErrors.pincode, /only in Kolkata/);
  assert.equal((await postAddress(jsonRequest("/api/addresses", "POST", { ...validAddress, familyMemberId: "nope" }))).status, 400);
});

test("addresses: create, make default, update and delete", async () => {
  const created = await (await postAddress(jsonRequest("/api/addresses", "POST", { ...validAddress, isDefault: true, familyMemberId: world.mother.id }))).json();
  assert.equal(created.isDefault, true);
  assert.equal((await prisma.address.findUniqueOrThrow({ where: { id: world.address.id } })).isDefault, false);
  assert.equal((await patchAddress(jsonRequest("/api/addresses", "PATCH", { ...validAddress, id: "missing" }))).status, 404);
  const updated = await (await patchAddress(jsonRequest("/api/addresses", "PATCH", { ...validAddress, id: created.id, label: "Work" }))).json();
  assert.equal(updated.label, "Work");
  assert.equal((await deleteAddress(get("/api/addresses"))).status, 400);
  assert.equal((await deleteAddress(get(`/api/addresses?id=${created.id}`))).status, 200);
  assert.equal(await prisma.address.count({ where: { id: created.id } }), 0);
});

test("addresses: the first address becomes the default and database errors are handled", async () => {
  await prisma.address.deleteMany();
  const first = await (await postAddress(jsonRequest("/api/addresses", "POST", validAddress))).json();
  assert.ok(first.id);
  const quiet = console.error;
  console.error = () => {};
  try {
    // An unknown pincode row breaks the address -> pincode foreign key.
    assert.equal((await postAddress(jsonRequest("/api/addresses", "POST", { ...validAddress, pincode: "700099" }))).status, 400);
    assert.equal((await patchAddress(jsonRequest("/api/addresses", "PATCH", { ...validAddress, id: first.id, pincode: "700099" }))).status, 400);
    const restore = stub(prisma.address, "deleteMany", async () => { throw new Error("db down"); });
    if (restore) {
      try { assert.equal((await deleteAddress(get(`/api/addresses?id=${first.id}`))).status, 500); } finally { restore(); }
    }
  } finally {
    console.error = quiet;
  }
});

test("family members: add, edit, list and remove", async () => {
  assert.equal((await postFamily(jsonRequest("/api/family", "POST", { name: " " }))).status, 400);
  const added = await (await postFamily(jsonRequest("/api/family", "POST", { name: " Baba ", relation: "Father" }))).json();
  assert.equal(added.name, "Baba");
  assert.equal((await (await getFamily()).json()).length, 2);
  assert.equal((await patchFamily(jsonRequest("/api/family", "PATCH", { id: added.id }))).status, 400);
  assert.equal((await patchFamily(jsonRequest("/api/family", "PATCH", { id: "nope", name: "X", relation: "Other" }))).status, 404);
  assert.equal((await (await patchFamily(jsonRequest("/api/family", "PATCH", { id: added.id, name: "Bapi", relation: "Father" }))).json()).name, "Bapi");
  assert.equal((await deleteFamily(get("/api/family"))).status, 400);
  assert.equal((await deleteFamily(get(`/api/family?id=${added.id}`))).status, 200);
  assert.equal(await prisma.familyMember.count({ where: { id: added.id } }), 0);
});

test("family members: database errors are handled", async () => {
  const quiet = console.error;
  console.error = () => {};
  const restoreCreate = stub(prisma.familyMember, "create", async () => { throw new Error("db"); });
  const restoreUpdate = stub(prisma.familyMember, "update", async () => { throw new Error("db"); });
  try {
    if (restoreCreate) assert.equal((await postFamily(jsonRequest("/api/family", "POST", { name: "A", relation: "Other" }))).status, 500);
    if (restoreUpdate) assert.equal((await patchFamily(jsonRequest("/api/family", "PATCH", { id: world.mother.id, name: "A", relation: "Other" }))).status, 500);
  } finally {
    restoreCreate?.();
    restoreUpdate?.();
    console.error = quiet;
  }
});

test("home: per-person refills, orders and stats", async () => {
  await prisma.refill.create({ data: { customerId: world.users.customer.id, productId: world.products.metformin.id, dosePerDay: 2, lastQty: 20, nextRunOutDate: new Date(Date.now() + 3 * 86_400_000) } });
  await prisma.refill.create({ data: { customerId: world.users.customer.id, familyMemberId: world.mother.id, productId: world.products.telmisartan.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: new Date(Date.now() - 86_400_000) } });
  await makeOrder(world);
  await makeOrder(world, { familyMemberId: world.mother.id, storeId: null });
  const me = await (await home(get("/api/home"))).json();
  assert.equal(me.refills.length, 1);
  assert.equal(me.refills[0].days, 3);
  assert.equal(me.orders.length, 1);
  assert.equal(me.selectedPerson.id, "me");
  assert.equal(me.familyStats.length, 2);
  assert.ok(["morning", "afternoon", "evening"].includes(me.greeting));
  const mother = await (await home(get(`/api/home?familyMemberId=${world.mother.id}`))).json();
  assert.equal(mother.selectedPerson.name, "Madhabi");
  assert.equal(mother.selectedPerson.nextRefill.days, 0);
  assert.equal(mother.orders[0].store, "");
  const unknown = await (await home(get("/api/home?familyMemberId=nobody"))).json();
  assert.equal(unknown.selectedPerson.id, "me");
});

test("home: a user with no refills, no name, or who was deleted", async () => {
  await prisma.user.update({ where: { id: world.users.customer.id }, data: { name: null } });
  const empty = await (await home(get("/api/home"))).json();
  assert.equal(empty.name, "Debasish Ghosh");
  assert.equal(empty.selectedPerson.nextRefill, null);
  const original = prisma.user.findUnique.bind(prisma.user);
  let calls = 0;
  const restore = stub(prisma.user, "findUnique", async (args: never) => { calls += 1; return calls === 1 ? original(args) : null; });
  if (restore) {
    try { assert.equal((await home(get("/api/home"))).status, 404); } finally { restore(); }
  }
});

test("notifications, profile, refills and search", async () => {
  await prisma.notification.create({ data: { userId: world.users.customer.id, message: "Hi" } });
  assert.equal((await (await getNotifications()).json()).unread, 1);
  await readNotifications();
  assert.equal((await (await getNotifications()).json()).unread, 0);

  assert.equal((await (await getProfile()).json()).phone, "9000000001");
  assert.equal((await (await patchProfile(jsonRequest("/api/profile", "PATCH", { preferredLanguage: "hi" }))).json()).preferredLanguage, "hi");
  assert.equal((await (await patchProfile(jsonRequest("/api/profile", "PATCH", {}))).json()).preferredLanguage, "en");

  const refill = await prisma.refill.create({ data: { customerId: world.users.customer.id, productId: world.products.metformin.id, dosePerDay: 1, lastQty: 10, nextRunOutDate: new Date() } });
  assert.equal((await patchRefill(jsonRequest("/x", "PATCH", { autoRemind: "no" }), params({ id: refill.id }))).status, 400);
  assert.equal((await patchRefill(jsonRequest("/x", "PATCH", { autoRemind: false }), params({ id: "missing" }))).status, 404);
  assert.deepEqual(await (await patchRefill(jsonRequest("/x", "PATCH", { autoRemind: false }), params({ id: refill.id }))).json(), { autoRemind: false });

  const all = await (await search(get("/api/search"))).json();
  assert.equal(all.length, 7);
  const found = await (await search(get("/api/search?q=Metf"))).json();
  assert.deepEqual(found.map((item: { strength: string }) => item.strength).sort(), ["1000 mg", "500 mg"]);
  assert.equal(typeof found[0].price, "number");
});
