import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { beforeEach, test } from "node:test";
import { POST as login } from "../../src/app/api/auth/login/route";
import { POST as logout } from "../../src/app/api/auth/logout/route";
import { POST as sendOtp } from "../../src/app/api/auth/otp/route";
import { GET as session } from "../../src/app/api/auth/session/route";
import { POST as signup } from "../../src/app/api/auth/signup/route";
import { MockOtpProvider } from "../../src/lib/otp/mock";
import { getSession, createSession } from "../../src/lib/session";
import { jsonRequest, prisma, seedWorld, signIn, type World } from "../support/db";

let world: World;
beforeEach(async () => { world = await seedWorld(); await signIn(); });

const hash = (code: string) => createHash("sha256").update(code).digest("hex");

test("OTP: validates the phone, returns a demo code and rate-limits", async () => {
  assert.equal((await sendOtp(jsonRequest("/api/auth/otp", "POST", { phone: "123" }))).status, 400);
  assert.equal((await sendOtp(jsonRequest("/api/auth/otp", "POST", { phone: 9000000001 }))).status, 400);
  const first = await sendOtp(jsonRequest("/api/auth/otp", "POST", { phone: "90000-00001" }));
  assert.equal(first.status, 200);
  assert.match((await first.json()).demoCode, /^\d{6}$/);
  await sendOtp(jsonRequest("/api/auth/otp", "POST", { phone: "9000000001" }));
  await sendOtp(jsonRequest("/api/auth/otp", "POST", { phone: "9000000001" }));
  const limited = await sendOtp(jsonRequest("/api/auth/otp", "POST", { phone: "9000000001" }));
  assert.equal(limited.status, 429);
});

test("OTP: a provider failure is a 503", async () => {
  process.env.OTP_PROVIDER = "firebase";
  const quiet = console.error;
  console.error = () => {};
  try {
    assert.equal((await sendOtp(jsonRequest("/api/auth/otp", "POST", { phone: "9000000001" }))).status, 503);
  } finally {
    process.env.OTP_PROVIDER = "mock";
    console.error = quiet;
  }
});

test("login: needs a 6-digit code and explains each failure", async () => {
  assert.equal((await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000001", otp: "12" }))).status, 400);
  assert.equal((await login(jsonRequest("/api/auth/login", "POST", { otp: "123456" }))).status, 400);
  const none = await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000001", otp: "123456" }));
  assert.equal(none.status, 401);
  assert.match((await none.json()).error, /expired/);

  await prisma.otpRequest.create({ data: { phone: "9000000001", codeHash: hash("111111"), expiresAt: new Date(Date.now() + 60_000), attempts: 3 } });
  const wrong = await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000001", otp: "222222" }));
  assert.equal(wrong.status, 401);
  assert.match((await wrong.json()).error, /not correct/);
  const blocked = await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000001", otp: "222222" }));
  assert.equal(blocked.status, 429);
  const stillBlocked = await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000001", otp: "111111" }));
  assert.equal(stillBlocked.status, 429);
});

test("login: a known user gets a session cookie and their home", async () => {
  const { demoCode } = await new MockOtpProvider().sendOtp("9000000002");
  const response = await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000002", otp: demoCode }));
  assert.deepEqual(await response.json(), { role: "PHARMACIST", home: "/pharmacist/queue" });
  assert.match(response.headers.get("set-cookie") ?? "", /medisaarthi-session=ey/);
  assert.equal(await prisma.otpRequest.count(), 0);
});

test("login: a new number is asked to make a profile, and a user without a name still logs in", async () => {
  const fresh = await new MockOtpProvider().sendOtp("9876543210");
  assert.deepEqual(await (await login(jsonRequest("/api/auth/login", "POST", { phone: "9876543210", otp: fresh.demoCode }))).json(), { needsProfile: true });
  await prisma.user.create({ data: { phone: "9111111111", role: "CUSTOMER" } });
  const nameless = await new MockOtpProvider().sendOtp("9111111111");
  assert.equal((await login(jsonRequest("/api/auth/login", "POST", { phone: "9111111111", otp: nameless.demoCode }))).status, 200);
});

test("login: an expired code is refused", async () => {
  await prisma.otpRequest.create({ data: { phone: "9000000001", codeHash: hash("111111"), expiresAt: new Date(Date.now() - 1000) } });
  assert.match((await (await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000001", otp: "111111" }))).json()).error, /expired/);
});

test("login: a non-Error failure is treated as a wrong code", async () => {
  const original = MockOtpProvider.prototype.verifyOtp;
  MockOtpProvider.prototype.verifyOtp = async () => { throw "weird"; };
  try {
    assert.equal((await login(jsonRequest("/api/auth/login", "POST", { phone: "9000000001", otp: "123456" }))).status, 401);
  } finally {
    MockOtpProvider.prototype.verifyOtp = original;
  }
});

test("signup: validates and creates the customer with family", async () => {
  assert.equal((await signup(jsonRequest("/api/auth/signup", "POST", { phone: "9222222222", name: "A" }))).status, 400);
  assert.equal((await signup(jsonRequest("/api/auth/signup", "POST", { name: "A", consent: true }))).status, 400);
  assert.equal((await signup(jsonRequest("/api/auth/signup", "POST", { phone: "9222222222", name: "A", consent: true, familyMembers: [{ name: "" }] }))).status, 400);
  const response = await signup(jsonRequest("/api/auth/signup", "POST", { phone: "92222 22222", name: " Arif ", consent: true, language: "bn", familyMembers: [{ name: "Ma", relation: "Mother" }] }));
  assert.deepEqual(await response.json(), { role: "CUSTOMER" });
  assert.match(response.headers.get("set-cookie") ?? "", /medisaarthi-session=/);
  const user = await prisma.user.findUniqueOrThrow({ where: { phone: "9222222222" }, include: { familyMembers: true } });
  assert.equal(user.name, "Arif");
  assert.equal(user.preferredLanguage, "bn");
  assert.equal(user.familyMembers.length, 1);
  await signup(jsonRequest("/api/auth/signup", "POST", { phone: "9333333333", name: "B", consent: true }));
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { phone: "9333333333" } })).preferredLanguage, "en");
});

test("session and logout", async () => {
  assert.equal((await session()).status, 401);
  await signIn(world.users.pharmacist);
  assert.deepEqual(await (await session()).json(), { name: "Ananya Roy", role: "PHARMACIST", user: { registrationNumber: "WB-PH-21487" } });
  await prisma.user.update({ where: { id: world.users.pharmacist.id }, data: { name: null } });
  assert.equal((await (await session()).json()).name, "Ananya Roy");
  const out = await logout();
  assert.match(out.headers.get("set-cookie") ?? "", /medisaarthi-session=;/);
});

test("getSession rejects deleted users and changed roles", async () => {
  assert.equal(await getSession(await createSession({ userId: "missing", role: "CUSTOMER", name: "x" })), null);
  assert.equal(await getSession(await createSession({ userId: world.users.customer.id, role: "PHARMACIST", name: "x" })), null);
  assert.equal((await getSession(await createSession({ userId: world.users.customer.id, role: "CUSTOMER", name: "x" })))?.user.phone, "9000000001");
});
