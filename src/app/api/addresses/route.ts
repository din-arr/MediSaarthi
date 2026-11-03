import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { haversineKm } from "../../../lib/routing";
import { readSession, SESSION_COOKIE } from "../../../lib/session";

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
    if (!pin) return NextResponse.json({ error: "We don't deliver to this pincode yet" }, { status: 404 });
    return NextResponse.json({ ...pin, city: pin.code.startsWith("711") ? "Howrah" : "Kolkata", area: pin.code === "700064" ? "Salt Lake" : pin.code === "700034" ? "Behala" : pin.code === "711101" ? "Howrah Maidan" : "Kolkata" });
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const pins = await prisma.pincode.findMany();
    const nearest = pins.sort((a, b) => haversineKm(lat, lng, a.lat, a.lng) - haversineKm(lat, lng, b.lat, b.lng))[0];
    return nearest ? NextResponse.json({ ...nearest, city: nearest.code.startsWith("711") ? "Howrah" : "Kolkata" }) : NextResponse.json({ error: "We don't deliver to this location yet" }, { status: 404 });
  }
  return NextResponse.json(await prisma.address.findMany({ where: { userId: id }, include: { familyMember: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }));
}

async function saveAddress(request: Request, method: "POST" | "PATCH") {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as AddressInput;
  const pincode = clean(body.pincode);
  const pin = await resolvePincode(pincode);
  if (!pin) return NextResponse.json({ error: "We don't deliver to this pincode yet" }, { status: 400 });
  const required: Array<[string, string | undefined]> = [["label", body.label], ["recipientName", body.recipientName], ["phone", body.phone], ["line1", body.line1], ["line2", body.line2]];
  const missing = required.find(([, value]) => !clean(value));
  if (missing || !/^\d{10}$/.test(clean(body.phone)) || !/^\d{6}$/.test(pincode)) return NextResponse.json({ error: "Please complete all address fields with valid values." }, { status: 400 });
  if (body.familyMemberId && !(await prisma.familyMember.findFirst({ where: { id: body.familyMemberId, userId: id } }))) return NextResponse.json({ error: "Family member not found." }, { status: 400 });
  const data = { label: clean(body.label), familyMemberId: body.familyMemberId || null, recipientName: clean(body.recipientName), phone: clean(body.phone), line1: clean(body.line1), line2: clean(body.line2), area: body.area?.trim() || (pincode === "700064" ? "Salt Lake" : pincode === "700034" ? "Behala" : pincode === "711101" ? "Howrah Maidan" : "Kolkata"), city: body.city?.trim() || (pincode.startsWith("711") ? "Howrah" : "Kolkata"), pincode, lat: pin.lat, lng: pin.lng, isDefault: Boolean(body.isDefault) };
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
