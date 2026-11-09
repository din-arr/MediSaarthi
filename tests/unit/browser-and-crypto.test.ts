import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { addToCart, onCartChange, readCart, writeCart } from "../../src/lib/cart";
import { decryptPrescription, encryptBuffer, encryptPrescription } from "../../src/lib/prescriptions/crypto";
import { getOtpProvider } from "../../src/lib/otp";
import { FirebaseOtpProvider } from "../../src/lib/otp/firebase";
import { MockOtpProvider } from "../../src/lib/otp/mock";
import proxy, { config } from "../../src/proxy";
import { createSession } from "../../src/lib/session";
import { setFirebaseVerify } from "../support/firebase-auth";

/** Minimal browser window: localStorage + events. */
function fakeWindow(storage: { getItem(key: string): string | null; setItem(key: string, value: string): void }) {
  const events = new EventTarget();
  (globalThis as unknown as Record<string, unknown>).window = Object.assign(events, { localStorage: storage });
}

test("cart adds, caps at 10 and notifies listeners", () => {
  const data = new Map<string, string>();
  fakeWindow({ getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } });
  let changes = 0;
  const stop = onCartChange(() => { changes += 1; });
  const item = { productId: "p1", name: "Paracetamol", strength: "500 mg", packSize: "Strip of 10", price: 20 };
  assert.deepEqual(readCart(), []);
  addToCart(item);
  addToCart({ ...item, productId: "p2" });
  for (let i = 0; i < 12; i += 1) addToCart(item);
  const cart = readCart();
  assert.equal(cart.length, 2);
  assert.equal(cart.find((entry) => entry.productId === "p1")?.quantity, 10);
  assert.equal(cart.find((entry) => entry.productId === "p2")?.quantity, 1);
  assert.equal(changes, 14);
  window.dispatchEvent(new Event("storage"));
  assert.equal(changes, 15);
  stop();
  writeCart([]);
  assert.equal(changes, 15);
});

test("cart survives blocked or broken storage", () => {
  fakeWindow({ getItem: () => "{not json", setItem: () => { throw new Error("blocked"); } });
  assert.deepEqual(readCart(), []);
  assert.doesNotThrow(() => writeCart([]));
});

test("prescriptions are encrypted in the database by default", async () => {
  const stored = await encryptBuffer(Buffer.from("hello"), "png");
  assert.equal(stored.encryptedFilePath, "db:png");
  assert.ok(stored.fileData && !Buffer.from(stored.fileData).includes(Buffer.from("hello")));
  const opened = await decryptPrescription(stored);
  assert.equal(opened.data.toString(), "hello");
  assert.equal(opened.contentType, "image/png");

  const pdf = await encryptPrescription(new File(["%PDF"], "rx.pdf", { type: "application/pdf" }));
  assert.equal((await decryptPrescription(pdf)).contentType, "application/pdf");
  const odd = await encryptPrescription(new File(["?"], "rx.bin", { type: "application/octet-stream" }));
  assert.equal(odd.encryptedFilePath, "db:jpg");
  assert.equal((await decryptPrescription({ encryptedFilePath: "db:gif", fileData: odd.fileData })).contentType, "image/jpeg");
});

test("disk storage writes an .enc file that can be read back", async () => {
  process.env.PRESCRIPTION_STORAGE = "disk";
  try {
    const stored = await encryptBuffer(Buffer.from("on disk"), "pdf");
    assert.match(stored.encryptedFilePath, /^uploads\/.+\.pdf\.enc$/);
    assert.equal(stored.fileData, null);
    const raw = await readFile(path.join(process.cwd(), stored.encryptedFilePath));
    assert.ok(!raw.includes(Buffer.from("on disk")));
    const opened = await decryptPrescription(stored);
    assert.equal(opened.data.toString(), "on disk");
    assert.equal(opened.contentType, "application/pdf");
    await rm(path.join(process.cwd(), stored.encryptedFilePath));
  } finally {
    delete process.env.PRESCRIPTION_STORAGE;
  }
});

test("encryption refuses a missing or wrong-size key", async () => {
  const key = process.env.PRESCRIPTION_KEY;
  try {
    delete process.env.PRESCRIPTION_KEY;
    await assert.rejects(() => encryptBuffer(Buffer.from("x"), "png"), /not configured/);
    process.env.PRESCRIPTION_KEY = Buffer.alloc(8).toString("base64");
    await assert.rejects(() => encryptBuffer(Buffer.from("x"), "png"), /32-byte/);
  } finally {
    process.env.PRESCRIPTION_KEY = key;
  }
});

test("OTP provider is chosen by env", () => {
  assert.ok(getOtpProvider() instanceof MockOtpProvider);
  process.env.OTP_PROVIDER = "firebase";
  try {
    assert.ok(getOtpProvider() instanceof FirebaseOtpProvider);
  } finally {
    process.env.OTP_PROVIDER = "mock";
  }
});

test("Firebase OTP checks the phone on the verified token", async () => {
  const provider = new FirebaseOtpProvider();
  await assert.rejects(() => provider.sendOtp(), /FIREBASE_CLIENT_REQUIRED/);
  process.env.FIREBASE_PRIVATE_KEY = "line1\\nline2";
  setFirebaseVerify(async () => ({ phone_number: "+91 90000 00001" }));
  await assert.doesNotReject(() => provider.verifyOtp("919000000001", "token"));
  await assert.rejects(() => provider.verifyOtp("919999999999", "token"), /INVALID_CODE/);
  setFirebaseVerify(async () => ({}));
  await assert.rejects(() => provider.verifyOtp("919000000001", "token"), /INVALID_CODE/);
  setFirebaseVerify(async () => { throw new Error("expired token"); });
  await assert.rejects(() => provider.verifyOtp("919000000001", "token"), /INVALID_CODE/);
  delete process.env.FIREBASE_PRIVATE_KEY;
});

test("proxy sends visitors to login and each role to its own home", async () => {
  const visit = async (pathname: string, role?: "CUSTOMER" | "PHARMACIST" | "STORE_STAFF" | "OPS") => {
    const headers = role ? { cookie: `medisaarthi-session=${await createSession({ userId: "u", role, name: "n" })}` } : undefined;
    return proxy(new NextRequest(`http://localhost${pathname}`, { headers }));
  };
  assert.equal((await visit("/home")).headers.get("location"), "http://localhost/login");
  assert.equal((await visit("/pharmacist/queue", "CUSTOMER")).headers.get("location"), "http://localhost/home");
  assert.equal((await visit("/home", "STORE_STAFF")).headers.get("location"), "http://localhost/pharmacist/store");
  assert.equal((await visit("/pharmacist/queue", "OPS")).headers.get("location"), "http://localhost/pharmacist/dashboard");
  const allowed = await visit("/pharmacist/queue", "PHARMACIST");
  assert.equal(allowed.headers.get("location"), null);
  assert.equal(allowed.headers.get("x-middleware-next"), "1");
  assert.ok(config.matcher.includes("/cart/:path*"));
});
