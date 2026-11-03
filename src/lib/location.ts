export type SupportedCity = "Kolkata" | "Howrah";

export function cityForPincode(pincode: string): SupportedCity | null {
  if (/^700\d{3}$/.test(pincode)) return "Kolkata";
  if (/^711\d{3}$/.test(pincode)) return "Howrah";
  return null;
}

export function isSupportedPincode(pincode: string) {
  return cityForPincode(pincode) !== null;
}

export function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const latitude = radians(toLat - fromLat);
  const longitude = radians(toLng - fromLng);
  const a = Math.sin(latitude / 2) ** 2 + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(longitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestPoint<T extends { lat: number; lng: number }>(origin: { lat: number; lng: number }, points: T[]) {
  return points
    .map((point) => ({ point, distanceKm: distanceKm(origin.lat, origin.lng, point.lat, point.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
}

export function approximateCityCoordinates(city: SupportedCity) {
  return city === "Howrah" ? { lat: 22.5958, lng: 88.2636 } : { lat: 22.5726, lng: 88.3639 };
}

export function isOutsideDeliveryArea(nearestStoreDistanceKm: number, limitKm = 25) {
  return nearestStoreDistanceKm > limitKm;
}
