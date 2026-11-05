import assert from "node:assert/strict";
import test from "node:test";
import { matchProduct } from "../../src/lib/ai/match";

const products = [
  { id: "m500", name: "Metformin", strength: "500 mg", schedule: "H" },
  { id: "m1000", name: "Metformin", strength: "1000 mg", schedule: "H" },
  { id: "t40", name: "Telmisartan", strength: "40 mg", schedule: "H" },
];

test("matches name and strength", () => {
  assert.equal(matchProduct({ name: "metformin", strength: "1000mg" }, products)?.id, "m1000");
  assert.equal(matchProduct({ name: "Metformin", strength: "1000" }, products)?.id, "m1000");
});

test("handles extra words like Tab", () => {
  assert.equal(matchProduct({ name: "Tab. Telmisartan", strength: "40 mg" }, products)?.id, "t40");
  assert.equal(matchProduct({ name: "Tab Metformin", strength: "500" }, products)?.id, "m500");
});

test("doesn't invent a match for unreadable text", () => {
  assert.equal(matchProduct({ name: "x?" }, products), null);
  assert.equal(matchProduct({ name: "Paracetamol" }, products), null);
});

test("falls back to the first candidate when strength is missing or unknown", () => {
  assert.equal(matchProduct({ name: "Metformin" }, products)?.id, "m500");
  assert.equal(matchProduct({ name: "Metformin", strength: "750 mg" }, products)?.id, "m500");
  assert.equal(matchProduct({}, products), null);
  assert.equal(matchProduct({ name: "Metform" }, products)?.id, "m500");
});
