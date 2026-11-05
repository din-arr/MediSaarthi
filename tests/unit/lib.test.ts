import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { SignJWT } from "jose";
import { canOpen, staffAccess } from "../../src/lib/access";
import { expiredSessionResponse, prismaErrorResponse } from "../../src/lib/apiErrors";
import { createSession, homeFor, readSession } from "../../src/lib/session";
import { getMedicineForm, medicineImages } from "../../src/lib/medicineImages";
import { images } from "../../src/lib/images";
import { mockUsers } from "../../src/lib/mockUsers";
import { notify } from "../../src/lib/notify";
import { packCount } from "../../src/lib/pharmacy/auth";
import { RuleError } from "../../src/lib/pharmacy/orderRules";

test("each role can only open its own screens", () => {
  assert.equal(canOpen("CUSTOMER", "/home"), true);
  assert.equal(canOpen("PHARMACIST", "/home"), false);
  assert.equal(canOpen("CUSTOMER", "/pharmacist/queue"), false);
  assert.equal(canOpen("PHARMACIST", "/pharmacist/queue"), true);
  assert.equal(canOpen("STORE_STAFF", "/pharmacist/queue"), false);
  assert.equal(canOpen("STORE_STAFF", "/pharmacist/store"), true);
  assert.equal(canOpen("OPS", "/pharmacist/dashboard"), true);
  assert.equal(canOpen("OPS", "/pharmacist/store"), false);
  // Unlisted staff pages: any staff role, never customers.
  assert.equal(canOpen("OPS", "/pharmacist/help"), true);
  assert.equal(canOpen("CUSTOMER", "/pharmacist/help"), false);
  assert.equal(staffAccess.length, 4);
});

test("sessions round-trip and bad tokens are refused", async () => {
  const token = await createSession({ userId: "u1", role: "PHARMACIST", name: "Ananya" });
  assert.deepEqual(await readSession(token), { userId: "u1", role: "PHARMACIST", name: "Ananya" });
  assert.equal(await readSession(undefined), null);
  assert.equal(await readSession("not-a-jwt"), null);
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "medisaarthi-demo-auth-secret-change-me");
  const sign = (payload: Record<string, unknown>) => new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).sign(secret);
  assert.equal(await readSession(await sign({ userId: 1, role: "CUSTOMER", name: "x" })), null);
  assert.equal(await readSession(await sign({ userId: "u", role: "ADMIN", name: "x" })), null);
  assert.equal(homeFor.STORE_STAFF, "/pharmacist/store");
});

test("prisma errors become friendly responses", async () => {
  const known = (code: string) => new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "6" });
  const quiet = console.error;
  console.error = () => {};
  try {
    const duplicate = prismaErrorResponse(known("P2002"), "fallback");
    assert.equal(duplicate.status, 409);
    assert.equal(prismaErrorResponse(known("P2003"), "fallback").status, 400);
    assert.match((await prismaErrorResponse(known("P2025"), "fallback").json()).error, /could not be found/);
    const unknownCode = prismaErrorResponse(known("P9999"), "fallback");
    assert.equal(unknownCode.status, 500);
    assert.equal((await prismaErrorResponse(new Error("x"), "Try again").json()).error, "Try again");
  } finally {
    console.error = quiet;
  }
  const expired = expiredSessionResponse();
  assert.equal(expired.status, 401);
  assert.match(expired.headers.get("set-cookie") ?? "", /medisaarthi-session=;/);
});

test("medicine form is guessed from the name", () => {
  const form = (name: string, category = "", explicit?: string) => getMedicineForm({ name, category, form: explicit } as never);
  assert.equal(form("Anything", "", "capsule"), "capsule");
  assert.equal(form("Salbutamol Inhaler", "", "unknown"), "inhaler");
  assert.equal(form("Cough Syrup"), "syrup");
  assert.equal(form("ORS"), "sachet");
  assert.equal(form("Electral Sachet"), "sachet");
  assert.equal(form("Diclofenac Gel"), "cream");
  assert.equal(form("Burn Cream"), "cream");
  assert.equal(form("Skin Ointment"), "cream");
  assert.equal(form("Eye Drops"), "drops");
  assert.equal(form("Nasal Spray"), "drops");
  assert.equal(form("Zinc", "Vitamins & minerals"), "vitamins");
  assert.equal(form("Vitamin C"), "vitamins");
  assert.equal(form("Omeprazole Capsule"), "capsule");
  assert.equal(form("Metformin"), "tablet");
  assert.equal(medicineImages.tablet, "/images/meds/tablets.jpg");
  assert.ok(images.hero.src.startsWith("/images/"));
  assert.equal(mockUsers.length, 2);
});

test("notify saves the message and only logs outside production", async () => {
  const saved: unknown[] = [];
  const db = { notification: { create: async (args: unknown) => { saved.push(args); } } } as never;
  const info = console.info;
  let logged = 0;
  console.info = () => { logged += 1; };
  try {
    await notify(db, "u1", "Hello", "o1");
    await notify(db, "u1", "Hi", undefined, "WHATSAPP");
    const env = process.env as Record<string, string | undefined>;
    const previous = env.NODE_ENV;
    env.NODE_ENV = "production";
    await notify(db, "u1", "Quiet");
    env.NODE_ENV = previous;
  } finally {
    console.info = info;
  }
  assert.equal(saved.length, 3);
  assert.deepEqual(saved[1], { data: { userId: "u1", orderId: undefined, message: "Hi", channel: "WHATSAPP" } });
  assert.equal(logged, 2);
});

test("pack counts and rule errors", () => {
  assert.equal(packCount("Strip of 15"), 15);
  assert.equal(packCount("Bottle"), 1);
  assert.equal(new RuleError("nope").status, 409);
  assert.equal(new RuleError("gone", 404).status, 404);
});
