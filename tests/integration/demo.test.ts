import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { freshenDemoOrders } from "../../src/lib/demo";
import { prisma, seedWorld, type World } from "../support/db";

let world: World;
beforeEach(async () => { world = await seedWorld(); });

const order = (number: string, status: "AWAITING_PHARMACIST" | "DELIVERED", hoursAgo: number) => prisma.order.create({ data: {
  number, customerId: world.users.customer.id, status, total: 10, createdAt: new Date(Date.now() - hoursAgo * 3_600_000),
} });

test("old demo orders look freshly placed again; real and recent ones are left alone", async () => {
  const stale = await order("RX-50214", "AWAITING_PHARMACIST", 30);
  const recent = await order("RX-50219", "AWAITING_PHARMACIST", 1);
  const done = await order("RX-50211", "DELIVERED", 30);
  const real = await order("RX-77777", "AWAITING_PHARMACIST", 30);
  assert.equal(await freshenDemoOrders(prisma), 1);
  const minutes = async (id: string) => Math.round((Date.now() - (await prisma.order.findUniqueOrThrow({ where: { id } })).createdAt.getTime()) / 60_000);
  assert.equal(await minutes(stale.id), 18);
  assert.equal(await minutes(recent.id), 60);
  assert.equal(await minutes(done.id), 1800);
  assert.equal(await minutes(real.id), 1800);
});

test("can be switched off", async () => {
  await order("RX-50214", "AWAITING_PHARMACIST", 30);
  process.env.DEMO_FRESH_ORDERS = "off";
  try {
    assert.equal(await freshenDemoOrders(prisma), 0);
  } finally {
    delete process.env.DEMO_FRESH_ORDERS;
  }
});
