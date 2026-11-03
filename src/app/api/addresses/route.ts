import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";
import { approximateCityCoordinates, cityForPincode, isOutsideDeliveryArea, nearestPoint } from "../../../lib/location";

type AddressInput = {
  id?: string;
  familyMemberId?: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  area?: string;
  city?: string;
  pincode?: string;
  isDefault?: boolean;
};

async function customerId() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  return session?.role === "CUSTOMER" ? session.userId : null;
}

function clean(value?: string) {
  return value?.trim() ?? "";
}

async function resolvePincode(pincode: string) {
  return prisma.pincode.findUnique({ where: { code: pincode } });
}

export async function GET(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const url = new URL(request.url);
  const pincode = url.searchParams.get("pincode");
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const lat = latParam === null ? Number.NaN : Number(latParam);
  const lng = lngParam === null ? Number.NaN : Number(lngParam);
  if (pincode) {
    const pin = await resolvePincode(pincode);
    const city = cityForPincode(pincode);
    if (!city) return NextResponse.json({ error: "Sorry, MediSaarthi currently delivers only in Kolkata and Howrah." }, { status: 404 });
    return pin ? NextResponse.json({ ...pin, city }) : NextResponse.json({ code: pincode, city, area: "", editableArea: true, hint: "We'll confirm this area" });
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const [pins, stores] = await Promise.all([prisma.pincode.findMany(), prisma.store.findMany({ select: { lat: true, lng: true } })]);
    const nearestStore = nearestPoint({ lat, lng }, stores);
    if (!nearestStore || isOutsideDeliveryArea(nearestStore.distanceKm)) return NextResponse.json({ error: `You seem to be outside our delivery area (about ${Math.round(nearestStore?.distanceKm ?? 0)} km from Kolkata). You can still enter a Kolkata or Howrah address.`, distanceKm: nearestStore?.distanceKm }, { status: 400 });
    const nearest = nearestPoint({ lat, lng }, pins);
    if (!nearest || nearest.distanceKm > 3) return NextResponse.json({ error: "We couldn't match your location to a nearby pincode. Please enter it instead." }, { status: 404 });
    return NextResponse.json({ ...nearest.point, distanceKm: nearest.distanceKm, detected: `Detected: ${nearest.point.area}, ${nearest.point.code}. Please check it`, city: cityForPincode(nearest.point.code) });
  }
  return NextResponse.json(await prisma.address.findMany({ where: { userId: id }, include: { familyMember: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }));
}

async function saveAddress(request: Request, method: "POST" | "PATCH") {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as AddressInput;
  const pincode = clean(body.pincode);
  const pin = await resolvePincode(pincode);
  const city = cityForPincode(pincode);
  const fieldErrors: Record<string, string> = {};
  if (!clean(body.label)) fieldErrors.label = "Choose an address label";
  if (!clean(body.recipientName)) fieldErrors.recipientName = "Enter a recipient name";
  if (!/^\d{10}$/.test(clean(body.phone))) fieldErrors.phone = "Enter a 10-digit mobile number";
  if (!clean(body.line1)) fieldErrors.line1 = "Enter your house or flat details";
  if (!clean(body.line2)) fieldErrors.line2 = "Enter a street or landmark";
  if (!/^\d{6}$/.test(pincode)) fieldErrors.pincode = "Pincode must be 6 digits";
  else if (!city) fieldErrors.pincode = "Sorry, MediSaarthi currently delivers only in Kolkata and Howrah.";
  if (!clean(body.area)) fieldErrors.area = "Enter an area";
  if (body.city !== city) fieldErrors.city = "City doesn't match this pincode";
  if (Object.keys(fieldErrors).length > 0) {
    if (process.env.NODE_ENV !== "production") console.warn("Address validation failed", { fields: Object.keys(fieldErrors), fieldErrors });
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors }, { status: 400 });
  }
  if (!city) return NextResponse.json({ error: "Sorry, MediSaarthi currently delivers only in Kolkata and Howrah.", fieldErrors: { pincode: "Sorry, MediSaarthi currently delivers only in Kolkata and Howrah." } }, { status: 400 });
  const coordinates = pin ?? { lat: approximateCityCoordinates(city).lat, lng: approximateCityCoordinates(city).lng, area: body.area };
  if (body.familyMemberId && !(await prisma.familyMember.findFirst({ where: { id: body.familyMemberId, userId: id } }))) return NextResponse.json({ error: "Family member not found." }, { status: 400 });
  const data = { label: clean(body.label), familyMemberId: body.familyMemberId || null, recipientName: clean(body.recipientName), phone: clean(body.phone), line1: clean(body.line1), line2: clean(body.line2), area: clean(body.area), city, pincode, lat: coordinates.lat, lng: coordinates.lng, isDefault: Boolean(body.isDefault) };
  const existing = await prisma.address.findMany({ where: { userId: id }, select: { id: true } });
  if (data.isDefault || existing.length === 0) await prisma.address.updateMany({ where: { userId: id }, data: { isDefault: false } });
  let address;
  if (method === "PATCH" && body.id) {
    const owned = await prisma.address.findFirst({ where: { id: body.id, userId: id } });
    if (!owned) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    address = await prisma.address.update({ where: { id: body.id }, data });
  } else {
    address = await prisma.address.create({ data: { ...data, userId: id } });
  }
  return NextResponse.json(address);
}

export async function POST(request: Request) { return saveAddress(request, "POST"); }
export async function PATCH(request: Request) { return saveAddress(request, "PATCH"); }

export async function DELETE(request: Request) {
  const id = await customerId();
  const addressId = new URL(request.url).searchParams.get("id");
  if (!id || !addressId) return NextResponse.json({ error: "Address not found." }, { status: 400 });
  await prisma.address.deleteMany({ where: { id: addressId, userId: id } });
  return NextResponse.json({ ok: true });
}
