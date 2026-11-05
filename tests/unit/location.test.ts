import assert from "node:assert/strict";
import test from "node:test";
import { approximateCityCoordinates, cityForPincode, distanceKm, isOutsideDeliveryArea, isSupportedPincode, nearestPoint } from "../../src/lib/location";
import { cityForServicePincode, supportConfig } from "../../src/lib/serviceArea";

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

test("pincode helpers and distances", () => {
  assert.equal(isSupportedPincode("700001"), true);
  assert.equal(isSupportedPincode("110001"), false);
  assert.equal(Math.round(distanceKm(22.5726, 88.3639, 22.5958, 88.2636)), 11);
  assert.equal(distanceKm(1, 1, 1, 1), 0);
});

test("nearestPoint picks the closest point, or null for an empty list", () => {
  const points = [{ id: "far", lat: 23, lng: 89 }, { id: "near", lat: 22.58, lng: 88.36 }];
  assert.equal(nearestPoint({ lat: 22.57, lng: 88.36 }, points)?.point.id, "near");
  assert.equal(nearestPoint({ lat: 22.57, lng: 88.36 }, []), null);
});

test("approximate city centres", () => {
  assert.deepEqual(approximateCityCoordinates("Howrah"), { lat: 22.5958, lng: 88.2636 });
  assert.deepEqual(approximateCityCoordinates("Kolkata"), { lat: 22.5726, lng: 88.3639 });
  assert.equal(isOutsideDeliveryArea(5, 4), true);
});

test("service areas and support contacts", () => {
  assert.equal(cityForServicePincode("700064"), "Kolkata");
  assert.equal(cityForServicePincode("711101"), "Howrah");
  assert.equal(cityForServicePincode("400001"), "");
  assert.ok(supportConfig.email.includes("@"));
  assert.ok(supportConfig.whatsapp.length > 5);
});
