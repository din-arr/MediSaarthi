import assert from "node:assert/strict";
import test from "node:test";
import { cityForPincode, isOutsideDeliveryArea } from "../src/lib/location";

test("maps Kolkata and Howrah pincode prefixes to the correct city", () => {
  assert.equal(cityForPincode("700064"), "Kolkata");
  assert.equal(cityForPincode("711101"), "Howrah");
  assert.equal(cityForPincode("560001"), null);
});

test("detects locations outside the delivery threshold", () => {
  assert.equal(isOutsideDeliveryArea(24.9), false);
  assert.equal(isOutsideDeliveryArea(25.1), true);
  assert.equal(isOutsideDeliveryArea(1400), true);
});
