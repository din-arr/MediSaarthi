import assert from "node:assert/strict";
import test from "node:test";
import { canAddToCart, checkTransition, needsPrescription, prescriptionExpired, type RuleOrder } from "../../src/lib/pharmacy/rules";

const fresh = { uploadedAt: new Date(), issuedOn: new Date() };
const order = (items: RuleOrder["items"], extra: Partial<RuleOrder> = {}): RuleOrder => ({ status: "AWAITING_PHARMACIST", items, prescription: fresh, verifiedByRegNo: "WB-PH-1", ...extra });

test("an unapproved Schedule H item blocks approval", () => {
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "PENDING" }]), "APPROVED")!, /pharmacist's decision/);
});

test("an approved order still can't skip straight to dispatch", () => {
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "APPROVED" }]), "OUT_FOR_DELIVERY")!, /can't move/);
});

test("Schedule H needs a registered pharmacist", () => {
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "APPROVED" }], { verifiedByRegNo: null }), "APPROVED")!, /registered pharmacist/);
});

test("H1 can't be approved without a register entry", () => {
  assert.match(checkTransition(order([{ schedule: "H1", approvalStatus: "APPROVED", hasH1Entry: false }]), "APPROVED")!, /H1 register/);
  assert.equal(checkTransition(order([{ schedule: "H1", approvalStatus: "APPROVED", hasH1Entry: true }]), "APPROVED"), null);
});

test("Schedule X is always blocked", () => {
  assert.equal(canAddToCart("X"), false);
  assert.match(checkTransition(order([{ schedule: "X", approvalStatus: "APPROVED" }]), "APPROVED")!, /Schedule X/);
});

test("an old prescription can't be used for Schedule H", () => {
  const old = new Date(Date.now() - 200 * 86_400_000);
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "APPROVED" }], { prescription: { uploadedAt: old, issuedOn: old } }), "APPROVED")!, /older than/);
});

test("packing an approved order works, packing an unapproved one doesn't", () => {
  assert.equal(checkTransition(order([{ schedule: "H", approvalStatus: "APPROVED" }], { status: "APPROVED" }), "PACKED"), null);
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "PENDING" }], { status: "APPROVED" }), "PACKED")!, /decision/);
});

test("OTC-only orders don't need a prescription check", () => {
  assert.equal(checkTransition(order([{ schedule: "OTC", approvalStatus: "APPROVED" }], { prescription: null, verifiedByRegNo: null }), "APPROVED"), null);
});

test("a generic waiting for customer consent blocks approval", () => {
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "APPROVED", awaitingConsent: true }]), "APPROVED")!, /accept or decline/);
});

test("rejecting or re-requesting skips the release checks", () => {
  assert.equal(checkTransition(order([{ schedule: "H", approvalStatus: "PENDING" }]), "REJECTED"), null);
  assert.equal(checkTransition(order([{ schedule: "H", approvalStatus: "PENDING" }]), "REUPLOAD_REQUESTED"), null);
});

test("an order with every item rejected can't be approved", () => {
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "REJECTED" }]), "APPROVED")!, /Every item was rejected/);
});

test("messages fall back to a generic label when the item has no name", () => {
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "APPROVED", awaitingConsent: true }]), "APPROVED")!, /an item/);
  assert.match(checkTransition(order([{ schedule: "H", approvalStatus: "PENDING" }]), "APPROVED")!, /^An item/);
  assert.match(checkTransition(order([{ schedule: "H1", approvalStatus: "APPROVED" }]), "APPROVED")!, /A Schedule H1 item/);
  assert.match(checkTransition(order([{ schedule: "H1", approvalStatus: "APPROVED", name: "Alprazolam" }]), "APPROVED")!, /Alprazolam/);
});

test("Schedule X can be allowed by config", () => {
  const rules = { prescriptionValidityDays: 180, xAllowedOnline: true };
  assert.equal(canAddToCart("X", rules), true);
  assert.equal(canAddToCart("OTC"), true);
  assert.equal(checkTransition(order([{ schedule: "X", approvalStatus: "APPROVED" }]), "APPROVED", rules), null);
});

test("missing prescription counts as expired; upload date is used when issue date is missing", () => {
  assert.equal(prescriptionExpired(order([], { prescription: null })), true);
  assert.equal(prescriptionExpired(order([], { prescription: { uploadedAt: new Date(), issuedOn: null } })), false);
  const now = new Date("2026-06-01");
  assert.equal(prescriptionExpired(order([], { prescription: { uploadedAt: new Date("2026-05-01") } }), { prescriptionValidityDays: 10, xAllowedOnline: false }, now), true);
});

test("unknown starting status is refused", () => {
  assert.match(checkTransition({ ...order([]), status: "WEIRD" as never }, "APPROVED")!, /can't move/);
});

test("needsPrescription is only H and H1", () => {
  assert.deepEqual((["OTC", "H", "H1", "X"] as const).map(needsPrescription), [false, true, true, false]);
});
