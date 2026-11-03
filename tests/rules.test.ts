import assert from "node:assert/strict";
import test from "node:test";
import { canAddToCart, checkTransition, type RuleOrder } from "../src/lib/pharmacy/rules";

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
